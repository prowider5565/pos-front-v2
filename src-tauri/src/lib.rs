use std::process::Command;

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
    let mut print_data: Vec<u8> = Vec::new();

    // ESC @ - Initialize printer
    print_data.extend_from_slice(&[0x1B, 0x40]);

    // ESC t n - Select character code table (CP437)
    print_data.extend_from_slice(&[0x1B, 0x74, 0x00]);

    let content_bytes = convert_to_cp437(content);
    print_data.extend_from_slice(&content_bytes);

    // 21 line feeds before cut
    print_data.extend_from_slice(&[
        0x0A, 0x0A, 0x0A, 0x0A, 0x0A, 0x0A, 0x0A, 0x0A, 0x0A, 0x0A,
        0x0A, 0x0A, 0x0A, 0x0A, 0x0A, 0x0A, 0x0A, 0x0A, 0x0A, 0x0A,
        0x0A,
    ]);

    // GS V 1 - Partial cut
    print_data.extend_from_slice(&[0x1D, 0x56, 0x01]);

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

fn convert_to_cp437(text: &str) -> Vec<u8> {
    let mut result = Vec::new();

    for ch in text.chars() {
        let byte = match ch {
            '\x00'..='\x7F' => ch as u8,
            '─' => 0xC4,
            '│' => 0xB3,
            '┌' => 0xDA,
            '┐' => 0xBF,
            '└' => 0xC0,
            '┘' => 0xD9,
            '├' => 0xC3,
            '┤' => 0xB4,
            '┬' => 0xC2,
            '┴' => 0xC1,
            '┼' => 0xC5,
            '═' => 0xCD,
            '║' => 0xBA,
            '╔' => 0xC9,
            '╗' => 0xBB,
            '╚' => 0xC8,
            '╝' => 0xBC,
            _ => {
                let code = ch as u32;
                if code < 256 { code as u8 } else { b'?' }
            }
        };

        result.push(byte);
    }

    result
}

#[cfg(target_os = "windows")]
fn print_windows(content: &[u8]) -> Result<String, String> {
    use std::fs::File;
    use std::io::Write;

    let temp_path = std::env::temp_dir().join("receipt.txt");
    let mut file = File::create(&temp_path)
        .map_err(|e| format!("Failed to create temp file: {}", e))?;

    file.write_all(content)
        .map_err(|e| format!("Failed to write to temp file: {}", e))?;

    let output = Command::new("notepad")
        .arg("/p")
        .arg(&temp_path)
        .output()
        .map_err(|e| format!("Failed to execute print command: {}", e))?;

    if output.status.success() {
        Ok("Print command sent successfully".to_string())
    } else {
        Err(format!("Print command failed: {:?}", output.stderr))
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
