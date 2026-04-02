use std::process::Command;

#[tauri::command]
fn check_telegram_installed() -> Result<bool, String> {
    log::info!("Checking if Telegram Desktop is installed");
    
    #[cfg(target_os = "windows")]
    {
        // Check common Telegram installation paths on Windows
        let paths = vec![
            std::env::var("LOCALAPPDATA").ok().map(|p| format!("{}\\Telegram\\Telegram.exe", p)),
            std::env::var("APPDATA").ok().map(|p| format!("{}\\Telegram Desktop\\Telegram.exe", p)),
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
        // Check if Telegram.app exists on macOS
        let telegram_path = "/Applications/Telegram.app";
        if std::path::Path::new(telegram_path).exists() {
            log::info!("Telegram found at: {}", telegram_path);
            return Ok(true);
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        // Try to find telegram in PATH
        match Command::new("which").arg("telegram-desktop").output() {
            Ok(output) => {
                if output.status.success() && !output.stdout.is_empty() {
                    log::info!("Telegram found in PATH");
                    return Ok(true);
                }
            }
            Err(_) => {}
        }
        
        // Check common installation paths
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
    
    // Try tg:// protocol first (Telegram Desktop deep link)
    let tg_url = url.replace("https://t.me/", "tg://resolve?domain=");
    
    #[cfg(target_os = "windows")]
    {
        // Try Telegram Desktop protocol first
        match Command::new("cmd")
            .args(["/C", "start", "", &tg_url])
            .spawn()
        {
            Ok(_) => {
                log::info!("Opened with Telegram Desktop protocol");
                return Ok(());
            }
            Err(e) => {
                log::warn!("Failed to open with tg:// protocol: {}, falling back to browser", e);
                // Fallback to browser
                Command::new("cmd")
                    .args(["/C", "start", &url])
                    .spawn()
                    .map_err(|e| format!("Failed to open: {}", e))?;
            }
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        // Try Telegram Desktop protocol first
        match Command::new("open").arg(&tg_url).spawn() {
            Ok(_) => {
                log::info!("Opened with Telegram Desktop protocol");
                return Ok(());
            }
            Err(e) => {
                log::warn!("Failed to open with tg:// protocol: {}, falling back to browser", e);
                // Fallback to browser
                Command::new("open")
                    .arg(&url)
                    .spawn()
                    .map_err(|e| format!("Failed to open: {}", e))?;
            }
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        // Try Telegram Desktop protocol first
        match Command::new("xdg-open").arg(&tg_url).spawn() {
            Ok(_) => {
                log::info!("Opened with Telegram Desktop protocol");
                return Ok(());
            }
            Err(e) => {
                log::warn!("Failed to open with tg:// protocol: {}, falling back to browser", e);
                // Fallback to browser
                Command::new("xdg-open")
                    .arg(&url)
                    .spawn()
                    .map_err(|e| format!("Failed to open: {}", e))?;
            }
        }
    }
    
    Ok(())
}

#[tauri::command]
fn print_receipt(content: String) -> Result<String, String> {
    log::info!("Print command received with content length: {}", content.len());
    
    // ESC/POS initialization commands
    let mut print_data: Vec<u8> = Vec::new();
    
    // ESC @ - Initialize printer
    print_data.extend_from_slice(&[0x1B, 0x40]);
    
    // ESC t n - Select character code table (CP437)
    print_data.extend_from_slice(&[0x1B, 0x74, 0x00]);
    
    // Convert content to CP437 encoding
    // For now, we'll use UTF-8 bytes directly as most content is ASCII
    // Box-drawing characters will need special handling
    let content_bytes = convert_to_cp437(&content);
    print_data.extend_from_slice(&content_bytes);
    
    // Leave a small bottom margin before cutting.
    print_data.extend_from_slice(&[0x0A, 0x0A, 0x0A, 0x0A, 0x0A, 0x0A]);
    
    // GS V 1 - Partial cut
    print_data.extend_from_slice(&[0x1D, 0x56, 0x01]);
    
    #[cfg(target_os = "windows")]
    {
        print_windows(&print_data)
    }
    
    #[cfg(target_os = "linux")]
    {
        print_linux(&print_data)
    }
    
    #[cfg(target_os = "macos")]
    {
        print_macos(&print_data)
    }
}

// Convert UTF-8 string to CP437 bytes
fn convert_to_cp437(text: &str) -> Vec<u8> {
    let mut result = Vec::new();
    
    for ch in text.chars() {
        let byte = match ch {
            // ASCII characters (0-127) map directly
            '\x00'..='\x7F' => ch as u8,
            
            // Box-drawing characters (CP437 encoding)
            '─' => 0xC4, // Horizontal line
            '│' => 0xB3, // Vertical line
            '┌' => 0xDA, // Top-left corner
            '┐' => 0xBF, // Top-right corner
            '└' => 0xC0, // Bottom-left corner
            '┘' => 0xD9, // Bottom-right corner
            '├' => 0xC3, // Left T
            '┤' => 0xB4, // Right T
            '┬' => 0xC2, // Top T
            '┴' => 0xC1, // Bottom T
            '┼' => 0xC5, // Cross
            
            // Extended ASCII / Special characters
            '═' => 0xCD, // Double horizontal line
            '║' => 0xBA, // Double vertical line
            '╔' => 0xC9, // Double top-left corner
            '╗' => 0xBB, // Double top-right corner
            '╚' => 0xC8, // Double bottom-left corner
            '╝' => 0xBC, // Double bottom-right corner
            
            // If character not in CP437, use space or question mark
            _ => {
                // Try to encode as UTF-8 byte sequence (fallback)
                // For safety, we'll just use the character's ASCII value if < 256
                let code = ch as u32;
                if code < 256 {
                    code as u8
                } else {
                    b'?' // Unknown character
                }
            }
        };
        result.push(byte);
    }
    
    result
}

#[cfg(target_os = "windows")]
fn print_windows(content: &[u8]) -> Result<String, String> {
    use std::io::Write;
    use std::fs::File;
    
    // Create a temporary file
    let temp_path = std::env::temp_dir().join("receipt.txt");
    let mut file = File::create(&temp_path)
        .map_err(|e| format!("Failed to create temp file: {}", e))?;
    
    file.write_all(content)
        .map_err(|e| format!("Failed to write to temp file: {}", e))?;
    
    // Print using notepad with /p flag (print and close)
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
    // Use lpr (Line Printer) command with raw mode
    let output = Command::new("lpr")
        .arg("-o")
        .arg("raw") // Send raw bytes including ESC/POS commands
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
    use std::io::Write;
    use std::fs::File;
    
    // Create a temporary file with raw bytes
    let temp_path = std::env::temp_dir().join("receipt.prn");
    let mut file = File::create(&temp_path)
        .map_err(|e| format!("Failed to create temp file: {}", e))?;
    
    file.write_all(content)
        .map_err(|e| format!("Failed to write to temp file: {}", e))?;
    
    // Use lpr with raw mode
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

      // Deep link handler is now automatic via plugin
      // The plugin will handle deep links automatically

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![print_receipt, open_telegram_link, check_telegram_installed])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
