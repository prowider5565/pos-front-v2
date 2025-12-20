use std::process::Command;

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
    
    // Add line feeds before cutting
    print_data.extend_from_slice(&[0x0A, 0x0A, 0x0A, 0x0A, 0x0A]); // 5 line feeds
    
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
    .invoke_handler(tauri::generate_handler![print_receipt])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
