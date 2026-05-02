use std::{
    io::{self, Read},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    thread::{self, JoinHandle},
    time::{Duration, Instant},
};

use serde::Serialize;
use serialport::{available_ports, SerialPort, SerialPortInfo, SerialPortType};
use tauri::{AppHandle, Emitter, Runtime};

const DEFAULT_BAUD_RATE: u32 = 9_600;
const DISCOVERY_INTERVAL: Duration = Duration::from_secs(2);
const RECONNECT_INTERVAL: Duration = Duration::from_secs(2);
const READ_TIMEOUT: Duration = Duration::from_millis(250);
const FRAME_IDLE_TIMEOUT: Duration = Duration::from_millis(75);
const DEDUPE_WINDOW: Duration = Duration::from_millis(250);
const MAX_FRAME_LENGTH: usize = 256;
const SLEEP_POLL_INTERVAL: Duration = Duration::from_millis(100);

const SCANNER_HINTS: &[&str] = &[
    "barcode",
    "scanner",
    "honeywell",
    "zebra",
    "symbol",
    "datalogic",
    "newland",
    "socket",
    "cipherlab",
];

#[derive(Clone, Debug)]
struct ScannerConfig {
    baud_rate: u32,
    vid_pid_allowlist: Vec<(u16, u16)>,
}

impl Default for ScannerConfig {
    fn default() -> Self {
        Self {
            baud_rate: std::env::var("SCANNER_BAUD_RATE")
                .ok()
                .and_then(|value| value.parse::<u32>().ok())
                .filter(|value| *value > 0)
                .unwrap_or(DEFAULT_BAUD_RATE),
            vid_pid_allowlist: parse_vid_pid_allowlist(
                std::env::var("SCANNER_VID_PID_ALLOWLIST").ok().as_deref(),
            ),
        }
    }
}

#[derive(Debug, Clone)]
struct PortMatch {
    port: SerialPortInfo,
    score: u32,
    reason: String,
}

#[derive(Default)]
struct ScanAccumulator {
    pending: String,
    last_chunk_at: Option<Instant>,
}

#[derive(Default)]
struct DuplicateGuard {
    last_barcode: Option<String>,
    last_seen_at: Option<Instant>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BarcodeScannedPayload {
    pub barcode: String,
}

pub struct ScannerManager {
    shutdown: Arc<AtomicBool>,
    worker: Mutex<Option<JoinHandle<()>>>,
    config: ScannerConfig,
}

impl ScannerManager {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            shutdown: Arc::new(AtomicBool::new(false)),
            worker: Mutex::new(None),
            config: ScannerConfig::default(),
        })
    }

    pub fn start<R: Runtime>(self: &Arc<Self>, app_handle: AppHandle<R>) {
        let mut worker = self.worker.lock().expect("scanner worker mutex poisoned");
        if worker.is_some() {
            log::warn!("ScannerManager start requested while worker is already running");
            return;
        }

        self.shutdown.store(false, Ordering::Relaxed);
        let shutdown = Arc::clone(&self.shutdown);
        let config = self.config.clone();

        *worker = Some(thread::spawn(move || {
            log::info!(
                "Starting ScannerManager worker with baud rate {}",
                config.baud_rate
            );
            run_worker(app_handle, shutdown, config);
            log::info!("ScannerManager worker stopped");
        }));
    }

    pub fn stop(&self) {
        self.shutdown.store(true, Ordering::Relaxed);

        let handle = self
            .worker
            .lock()
            .expect("scanner worker mutex poisoned")
            .take();

        if let Some(handle) = handle {
            if let Err(error) = handle.join() {
                log::error!("Failed to join scanner worker thread: {:?}", error);
            }
        }
    }
}

impl Drop for ScannerManager {
    fn drop(&mut self) {
        self.shutdown.store(true, Ordering::Relaxed);
    }
}

fn run_worker<R: Runtime>(
    app_handle: AppHandle<R>,
    shutdown: Arc<AtomicBool>,
    config: ScannerConfig,
) {
    while !shutdown.load(Ordering::Relaxed) {
        let Some(port_match) = discover_scanner_port(&config) else {
            log::info!("No scanner port detected, retrying discovery");
            interruptible_sleep(&shutdown, DISCOVERY_INTERVAL);
            continue;
        };

        log::info!(
            "Scanner candidate selected: {} ({})",
            port_match.port.port_name,
            port_match.reason
        );

        match open_port(&port_match.port, config.baud_rate) {
            Ok(mut port) => {
                log::info!("Scanner connected on {}", port_match.port.port_name);
                if let Err(error) = port.clear(serialport::ClearBuffer::All) {
                    log::debug!(
                        "Failed to clear scanner buffers on {}: {}",
                        port_match.port.port_name,
                        error
                    );
                }

                if let Err(error) = consume_port(
                    &app_handle,
                    &shutdown,
                    &mut *port,
                    &port_match.port.port_name,
                ) {
                    log::warn!(
                        "Scanner stream ended for {}: {}",
                        port_match.port.port_name,
                        error
                    );
                }
            }
            Err(error) => {
                log::error!(
                    "Failed to connect to scanner on {}: {}",
                    port_match.port.port_name,
                    error
                );
            }
        }

        if shutdown.load(Ordering::Relaxed) {
            break;
        }

        log::info!("Scheduling scanner reconnect attempt");
        interruptible_sleep(&shutdown, RECONNECT_INTERVAL);
    }
}

fn discover_scanner_port(config: &ScannerConfig) -> Option<PortMatch> {
    let ports = match available_ports() {
        Ok(ports) => ports,
        Err(error) => {
            log::error!("Failed to enumerate serial ports: {}", error);
            return None;
        }
    };

    if ports.is_empty() {
        log::info!("Serial port enumeration returned no ports");
        return None;
    }

    log::info!("Discovered {} serial port(s)", ports.len());
    for port in &ports {
        log::info!("Serial port candidate: {}", describe_port(port));
    }

    let mut matches = ports
        .into_iter()
        .filter_map(|port| score_port(port, config))
        .collect::<Vec<_>>();

    matches.sort_by(|left, right| right.score.cmp(&left.score));
    matches.into_iter().next()
}

fn score_port(port: SerialPortInfo, config: &ScannerConfig) -> Option<PortMatch> {
    let single_port_fallback = 10;
    let mut score = single_port_fallback;
    let mut reasons = Vec::new();

    match &port.port_type {
        SerialPortType::UsbPort(usb) => {
            if config.vid_pid_allowlist.contains(&(usb.vid, usb.pid)) {
                score += 10_000;
                reasons.push(format!(
                    "VID:PID allowlist match {:04x}:{:04x}",
                    usb.vid, usb.pid
                ));
            } else {
                let usb_descriptor = format!(
                    "{} {} {:04x}:{:04x}",
                    usb.manufacturer.clone().unwrap_or_default(),
                    usb.product.clone().unwrap_or_default(),
                    usb.vid,
                    usb.pid
                )
                .to_lowercase();

                if contains_scanner_hint(&usb_descriptor) {
                    score += 5_000;
                    reasons.push(format!(
                        "USB descriptor hints scanner ({:04x}:{:04x})",
                        usb.vid, usb.pid
                    ));
                } else {
                    score += 250;
                    reasons.push(format!(
                        "USB serial device ({:04x}:{:04x})",
                        usb.vid, usb.pid
                    ));
                }
            }
        }
        SerialPortType::PciPort => {
            reasons.push("PCI serial port".to_string());
        }
        SerialPortType::BluetoothPort => {
            if contains_scanner_hint(&port.port_name) {
                score += 2_000;
                reasons.push("Bluetooth port name hints scanner".to_string());
            }
        }
        SerialPortType::Unknown => {
            if contains_scanner_hint(&port.port_name) {
                score += 1_000;
                reasons.push("Port name hints scanner".to_string());
            }
        }
    }

    if reasons.is_empty() {
        log::debug!("Skipping low-confidence serial port {}", port.port_name);
        return None;
    }

    Some(PortMatch {
        port,
        score,
        reason: reasons.join(", "),
    })
}

fn open_port(port: &SerialPortInfo, baud_rate: u32) -> serialport::Result<Box<dyn SerialPort>> {
    serialport::new(&port.port_name, baud_rate)
        .timeout(READ_TIMEOUT)
        .open()
}

fn consume_port<R: Runtime>(
    app_handle: &AppHandle<R>,
    shutdown: &AtomicBool,
    port: &mut dyn SerialPort,
    port_name: &str,
) -> io::Result<()> {
    let mut buffer = [0u8; 512];
    let mut accumulator = ScanAccumulator::default();
    let mut duplicate_guard = DuplicateGuard::default();

    loop {
        if shutdown.load(Ordering::Relaxed) {
            break;
        }

        match port.read(&mut buffer) {
            Ok(bytes_read) if bytes_read > 0 => {
                let chunk = &buffer[..bytes_read];
                log::debug!("Received {} byte(s) from scanner {}", bytes_read, port_name);

                for barcode in accumulator.push_chunk(chunk) {
                    emit_barcode(app_handle, &mut duplicate_guard, barcode);
                }
            }
            Ok(_) => {
                if let Some(barcode) = accumulator.flush_if_idle() {
                    emit_barcode(app_handle, &mut duplicate_guard, barcode);
                }
            }
            Err(error) if error.kind() == io::ErrorKind::TimedOut => {
                if let Some(barcode) = accumulator.flush_if_idle() {
                    emit_barcode(app_handle, &mut duplicate_guard, barcode);
                }
            }
            Err(error) => {
                log::warn!("Scanner read error on {}: {}", port_name, error);
                return Err(error);
            }
        }
    }

    Ok(())
}

fn emit_barcode<R: Runtime>(
    app_handle: &AppHandle<R>,
    duplicate_guard: &mut DuplicateGuard,
    barcode: String,
) {
    if !duplicate_guard.should_emit(&barcode) {
        log::debug!(
            "Ignoring duplicate barcode within debounce window: {}",
            barcode
        );
        return;
    }

    log::info!("Barcode scanned: {}", barcode);

    if let Err(error) = app_handle.emit(
        "barcode_scanned",
        BarcodeScannedPayload {
            barcode: barcode.clone(),
        },
    ) {
        log::error!("Failed to emit barcode_scanned event: {}", error);
    }
}

impl ScanAccumulator {
    fn push_chunk(&mut self, chunk: &[u8]) -> Vec<String> {
        let text = String::from_utf8_lossy(chunk);
        self.last_chunk_at = Some(Instant::now());
        let mut completed = Vec::new();

        for fragment in text.split_inclusive(['\n', '\r']) {
            let mut part = fragment.to_string();
            let has_terminator = part.ends_with('\n') || part.ends_with('\r');
            if has_terminator {
                part = part.trim_end_matches(['\n', '\r']).to_string();
            }

            if !part.is_empty() {
                self.pending.push_str(&part);
            }

            if self.pending.len() > MAX_FRAME_LENGTH {
                log::warn!(
                    "Discarding malformed scanner frame longer than {} characters",
                    MAX_FRAME_LENGTH
                );
                self.pending.clear();
                continue;
            }

            if has_terminator {
                if let Some(barcode) = normalize_barcode(&self.pending) {
                    completed.push(barcode);
                } else if !self.pending.trim().is_empty() {
                    log::warn!("Discarding malformed barcode frame: {:?}", self.pending);
                }
                self.pending.clear();
            }
        }

        completed
    }

    fn flush_if_idle(&mut self) -> Option<String> {
        let Some(last_chunk_at) = self.last_chunk_at else {
            return None;
        };

        if self.pending.is_empty() || last_chunk_at.elapsed() < FRAME_IDLE_TIMEOUT {
            return None;
        }

        let pending = std::mem::take(&mut self.pending);
        normalize_barcode(&pending)
    }
}

impl DuplicateGuard {
    fn should_emit(&mut self, barcode: &str) -> bool {
        let now = Instant::now();
        let should_drop = self
            .last_barcode
            .as_deref()
            .zip(self.last_seen_at)
            .map(|(last_barcode, last_seen_at)| {
                last_barcode == barcode && now.duration_since(last_seen_at) <= DEDUPE_WINDOW
            })
            .unwrap_or(false);

        if should_drop {
            return false;
        }

        self.last_barcode = Some(barcode.to_string());
        self.last_seen_at = Some(now);
        true
    }
}

fn normalize_barcode(raw: &str) -> Option<String> {
    let cleaned = raw
        .trim()
        .chars()
        .filter(|character| !character.is_control())
        .collect::<String>();

    if cleaned.is_empty() {
        return None;
    }

    Some(cleaned)
}

fn contains_scanner_hint(value: &str) -> bool {
    let value = value.to_lowercase();
    SCANNER_HINTS.iter().any(|hint| value.contains(hint))
}

fn describe_port(port: &SerialPortInfo) -> String {
    match &port.port_type {
        SerialPortType::UsbPort(usb) => format!(
            "{} | USB {:04x}:{:04x} | manufacturer={} | product={}",
            port.port_name,
            usb.vid,
            usb.pid,
            usb.manufacturer.as_deref().unwrap_or("unknown"),
            usb.product.as_deref().unwrap_or("unknown")
        ),
        SerialPortType::BluetoothPort => format!("{} | Bluetooth", port.port_name),
        SerialPortType::PciPort => format!("{} | PCI", port.port_name),
        SerialPortType::Unknown => format!("{} | Unknown", port.port_name),
    }
}

fn parse_vid_pid_allowlist(value: Option<&str>) -> Vec<(u16, u16)> {
    value
        .unwrap_or_default()
        .split(',')
        .filter_map(|pair| {
            let (vid, pid) = pair.trim().split_once(':')?;
            Some((
                u16::from_str_radix(vid, 16).ok()?,
                u16::from_str_radix(pid, 16).ok()?,
            ))
        })
        .collect()
}

fn interruptible_sleep(shutdown: &AtomicBool, duration: Duration) {
    let started_at = Instant::now();
    while !shutdown.load(Ordering::Relaxed) && started_at.elapsed() < duration {
        thread::sleep(SLEEP_POLL_INTERVAL.min(duration.saturating_sub(started_at.elapsed())));
    }
}
