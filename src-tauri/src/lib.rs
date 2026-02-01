use std::process::Command;

#[tauri::command]
fn print_raw_text(content: String) -> Result<String, String> {
    println!("=== PRINT CONTENT START ===");
    println!("{}", content);
    println!("=== PRINT CONTENT END ===");
    
    #[cfg(target_os = "windows")]
    {
        print_windows(&content)
    }
    
    #[cfg(target_os = "linux")]
    {
        print_linux(&content)
    }
    
    #[cfg(target_os = "macos")]
    {
        print_macos(&content)
    }
}

#[cfg(target_os = "windows")]
fn print_windows(content: &str) -> Result<String, String> {
    use std::io::Write;
    use std::fs::File;
    
    // Save to temp file
    let temp_path = std::env::temp_dir().join("receipt.txt");
    let mut file = File::create(&temp_path)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    
    file.write_all(content.as_bytes())
        .map_err(|e| format!("Failed to write: {}", e))?;
    
    drop(file);
    
    let path_str = temp_path.to_str().ok_or("Path error")?;
    
    // Use notepad /p to print
    let output = Command::new("notepad")
        .args(&["/p", path_str])
        .output()
        .map_err(|e| format!("Print failed: {}", e))?;
    
    if output.status.success() {
        Ok("Printed".to_string())
    } else {
        Err("Failed".to_string())
    }
}

#[cfg(target_os = "linux")]
fn print_linux(content: &str) -> Result<String, String> {
    use std::io::Write;
    use std::fs::File;
    
    let temp_path = std::env::temp_dir().join("receipt.txt");
    let mut file = File::create(&temp_path).map_err(|e| e.to_string())?;
    file.write_all(content.as_bytes()).map_err(|e| e.to_string())?;
    drop(file);
    
    let output = Command::new("lpr")
        .arg(&temp_path)
        .output()
        .map_err(|e| e.to_string())?;
    
    if output.status.success() {
        Ok("Printed".to_string())
    } else {
        Err("Failed".to_string())
    }
}

#[cfg(target_os = "macos")]
fn print_macos(content: &str) -> Result<String, String> {
    use std::io::Write;
    use std::fs::File;
    
    let temp_path = std::env::temp_dir().join("receipt.txt");
    let mut file = File::create(&temp_path).map_err(|e| e.to_string())?;
    file.write_all(content.as_bytes()).map_err(|e| e.to_string())?;
    drop(file);
    
    let output = Command::new("lpr")
        .arg(&temp_path)
        .output()
        .map_err(|e| e.to_string())?;
    
    if output.status.success() {
        Ok("Printed".to_string())
    } else {
        Err("Failed".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .target(tauri_plugin_log::Target::new(
                        tauri_plugin_log::TargetKind::Stdout,
                    ))
                    .target(tauri_plugin_log::Target::new(
                        tauri_plugin_log::TargetKind::LogDir {
                            file_name: Some("app.log".to_string()),
                        },
                    ))
                    .build(),
            )?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![print_raw_text])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
