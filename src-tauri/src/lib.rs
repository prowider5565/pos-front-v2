use std::process::Command;
use encoding_rs::IBM866;

#[cfg(target_os = "windows")]
use windows::{
    core::{Error as WinError, PWSTR},
    Win32::Graphics::Printing::{
        ClosePrinter, DOC_INFO_1W, EndDocPrinter, EndPagePrinter, GetDefaultPrinterW, OpenPrinterW,
        StartDocPrinterW, StartPagePrinter, WritePrinter,
    },
};

#[tauri::command]
fn check_telegram_installed() -> Result<bool, String> {
    log::info!("Checking if Telegram Desktop is installed");

    #[cfg(target_os = "windows")]
    {
        let paths = vec![
            std::env::var("LOCALAPPDATA")
                .ok()
                .map(|p| format!("{}\\Telegram\\Telegram.exe", p)),
            std::env::var("APPDATA")
                .ok()
                .map(|p| format!("{}\\Telegram Desktop\\Telegram.exe", p)),
            Some("C:\\Program Files\\Telegram Desktop\\Telegram.exe".to_string()),
        ];

        for path in paths.iter().flatten() {
            if std::path::Path::new(path).exists() {
                log::info!("Telegram found at: {}", path);
                return Ok(true);
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        let telegram_path = "/Applications/Telegram.app";
        if std::path::Path::new(telegram_path).exists() {
            log::info!("Telegram found at: {}", telegram_path);
            return Ok(true);
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(output) = Command::new("which").arg("telegram-desktop").output() {
            if output.status.success() && !output.stdout.is_empty() {
                log::info!("Telegram found in PATH");
                return Ok(true);
            }
        }

        let paths = vec![
            "/usr/bin/telegram-desktop",
            "/usr/local/bin/telegram-desktop",
            "/snap/bin/telegram-desktop",
            "/opt/telegram/Telegram",
        ];

        for path in paths {
            if std::path::Path::new(path).exists() {
                log::info!("Telegram found at: {}", path);
                return Ok(true);
            }
        }
    }

    log::info!("Telegram Desktop not found");
    Ok(false)
}

#[tauri::command]
fn open_telegram_link(url: String) -> Result<(), String> {
    log::info!("Opening Telegram link URL: {}", url);

    let tg_url = url.replace("https://t.me/", "tg://resolve?domain=");

    #[cfg(target_os = "windows")]
    {
        match Command::new("cmd")
            .args(["/C", "start", "", &tg_url])
            .spawn()
        {
            Ok(_) => {
                log::info!("Opened with Telegram Desktop protocol");
                return Ok(());
            }
            Err(e) => {
                log::warn!(
                    "Failed to open with tg:// protocol: {}, falling back to browser",
                    e
                );
                Command::new("cmd")
                    .args(["/C", "start", &url])
                    .spawn()
                    .map_err(|e| format!("Failed to open: {}", e))?;
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        match Command::new("open").arg(&tg_url).spawn() {
            Ok(_) => {
                log::info!("Opened with Telegram Desktop protocol");
                return Ok(());
            }
            Err(e) => {
                log::warn!(
                    "Failed to open with tg:// protocol: {}, falling back to browser",
                    e
                );
                Command::new("open")
                    .arg(&url)
                    .spawn()
                    .map_err(|e| format!("Failed to open: {}", e))?;
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        match Command::new("xdg-open").arg(&tg_url).spawn() {
            Ok(_) => {
                log::info!("Opened with Telegram Desktop protocol");
                return Ok(());
            }
            Err(e) => {
                log::warn!(
                    "Failed to open with tg:// protocol: {}, falling back to browser",
                    e
                );
                Command::new("xdg-open")
                    .arg(&url)
                    .spawn()
                    .map_err(|e| format!("Failed to open: {}", e))?;
            }
        }
    }

    Ok(())
}

fn build_print_data(content: &str) -> Vec<u8> {
    const PRINTER_INIT: &[u8] = b"\x1b@";
    const OPEN_DRAWER: &[u8] = b"\x1b\x70\x00\x19\xfa";
    const DISABLE_MULTIBYTE_MODE: &[u8] = b"\x1c\x2e";
    const ESC_POS_CODEPAGE_SEQUENCE: &[u8] = b"\x1b\x74\x11";
    const FONT_A: &[u8] = b"\x1b\x4d\x00";
    const NORMAL_SIZE: &[u8] = b"\x1d\x21\x00";
    const TIGHTER_LINE_SPACING: &[u8] = b"\x1b\x33\x12";
    const CUT_PAPER: &[u8] = b"\x1d\x56\x00";
    const LINE_FEEDS_AFTER_PRINT: usize = 8;

    let normalized = content.replace("\r\n", "\n");
    let (encoded, _, _) = IBM866.encode(&normalized);

    let mut print_data: Vec<u8> = Vec::new();
    print_data.extend_from_slice(PRINTER_INIT);
    print_data.extend_from_slice(OPEN_DRAWER);
    print_data.extend_from_slice(DISABLE_MULTIBYTE_MODE);
    print_data.extend_from_slice(ESC_POS_CODEPAGE_SEQUENCE);
    print_data.extend_from_slice(FONT_A);
    print_data.extend_from_slice(NORMAL_SIZE);
    print_data.extend_from_slice(TIGHTER_LINE_SPACING);
    print_data.extend_from_slice(encoded.as_ref());
    print_data.extend(std::iter::repeat(b'\n').take(LINE_FEEDS_AFTER_PRINT));
    print_data.extend_from_slice(CUT_PAPER);

    print_data
}

#[tauri::command]
fn print_receipt(content: String) -> Result<String, String> {
    log::info!("Print command received with content length: {}", content.len());
    let print_data = build_print_data(&content);

    #[cfg(target_os = "windows")]
    {
        return print_windows(&print_data);
    }

    #[cfg(target_os = "linux")]
    {
        return print_linux(&print_data);
    }

    #[cfg(target_os = "macos")]
    {
        return print_macos(&print_data);
    }

    #[allow(unreachable_code)]
    Err("Unsupported operating system".to_string())
}

#[tauri::command]
fn fake_print_receipt(content: String) -> Result<String, String> {
    use std::fs::File;
    use std::io::Write;

    log::info!(
        "Fake print command received with content length: {}",
        content.len()
    );

    let print_data = build_print_data(&content);
    let temp_dir = std::env::temp_dir();
    let text_path = temp_dir.join("receipt_payload_preview.txt");
    let raw_path = temp_dir.join("receipt_payload_preview.prn");

    File::create(&text_path)
        .and_then(|mut f| f.write_all(content.as_bytes()))
        .map_err(|e| format!("Failed to write text preview: {}", e))?;

    File::create(&raw_path)
        .and_then(|mut f| f.write_all(&print_data))
        .map_err(|e| format!("Failed to write ESC/POS preview: {}", e))?;

    Ok(format!(
        "Fake print generated. Text: {} | Raw: {} | Bytes: {}",
        text_path.display(),
        raw_path.display(),
        print_data.len()
    ))
}

#[cfg(target_os = "windows")]
fn print_windows(content: &[u8]) -> Result<String, String> {
    fn to_wide(value: &str) -> Vec<u16> {
        value.encode_utf16().chain(std::iter::once(0)).collect()
    }

    fn last_error(message: &str) -> String {
        format!("{}: {}", message, WinError::from_win32())
    }

    unsafe {
        let mut needed = 0u32;
        let _ = GetDefaultPrinterW(PWSTR::null(), &mut needed);
        if needed == 0 {
            return Err("No default printer configured".to_string());
        }

        let mut printer_name = vec![0u16; needed as usize];
        if !GetDefaultPrinterW(PWSTR(printer_name.as_mut_ptr()), &mut needed).as_bool() {
            return Err(last_error("Failed to get default printer"));
        }

        let mut printer = std::mem::zeroed();
        OpenPrinterW(
            PWSTR(printer_name.as_mut_ptr()),
            &mut printer,
            None,
        )
        .map_err(|e| format!("Failed to open printer: {}", e))?;

        let doc_name = to_wide("POS receipt");
        let raw = to_wide("RAW");
        let doc_info = DOC_INFO_1W {
            pDocName: PWSTR(doc_name.as_ptr() as *mut _),
            pOutputFile: PWSTR::null(),
            pDatatype: PWSTR(raw.as_ptr() as *mut _),
        };

        let result = (|| {
            let job_id = StartDocPrinterW(printer, 1, &doc_info);
            if job_id == 0 {
                return Err(last_error("Failed to start RAW print job"));
            }

            if !StartPagePrinter(printer).as_bool() {
                let _ = EndDocPrinter(printer);
                return Err(last_error("Failed to start printer page"));
            }

            let mut written = 0u32;
            if !WritePrinter(
                printer,
                content.as_ptr() as *const _,
                content.len() as u32,
                &mut written,
            )
            .as_bool()
            {
                let _ = EndPagePrinter(printer);
                let _ = EndDocPrinter(printer);
                return Err(last_error("Failed to write RAW print data"));
            }

            if !EndPagePrinter(printer).as_bool() {
                let _ = EndDocPrinter(printer);
                return Err(last_error("Failed to end printer page"));
            }
            if !EndDocPrinter(printer).as_bool() {
                return Err(last_error("Failed to end printer document"));
            }

            if written != content.len() as u32 {
                return Err(format!(
                    "Printer accepted only {} of {} bytes",
                    written,
                    content.len()
                ));
            }

            Ok(format!("RAW print sent to default printer ({} bytes)", written))
        })();

        let _ = ClosePrinter(printer);
        result
    }
}

#[cfg(target_os = "linux")]
fn print_linux(content: &[u8]) -> Result<String, String> {
    let output = Command::new("lpr")
        .arg("-o")
        .arg("raw")
        .arg("-")
        .stdin(std::process::Stdio::piped())
        .spawn()
        .and_then(|mut child| {
            use std::io::Write;
            if let Some(mut stdin) = child.stdin.take() {
                stdin.write_all(content)?;
            }
            child.wait()
        })
        .map_err(|e| format!("Failed to execute lpr: {}", e))?;

    if output.success() {
        Ok("Print sent to default printer".to_string())
    } else {
        Err("Print command failed".to_string())
    }
}

#[cfg(target_os = "macos")]
fn print_macos(content: &[u8]) -> Result<String, String> {
    use std::fs::File;
    use std::io::Write;

    let temp_path = std::env::temp_dir().join("receipt.prn");
    let mut file = File::create(&temp_path)
        .map_err(|e| format!("Failed to create temp file: {}", e))?;

    file.write_all(content)
        .map_err(|e| format!("Failed to write to temp file: {}", e))?;

    let output = Command::new("lpr")
        .arg("-o")
        .arg("raw")
        .arg(&temp_path)
        .output()
        .map_err(|e| format!("Failed to execute lpr: {}", e))?;

    if output.status.success() {
        Ok("Print sent to default printer".to_string())
    } else {
        Err(format!("Print command failed: {:?}", output.stderr))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            print_receipt,
            fake_print_receipt,
            open_telegram_link,
            check_telegram_installed
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
