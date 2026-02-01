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
    
    // Get default printer name
    let printer_cmd = Command::new("powershell")
        .args(&[
            "-NoProfile",
            "-Command",
            "(Get-CimInstance Win32_Printer | Where-Object {$_.Default -eq $true}).Name"
        ])
        .output()
        .map_err(|e| format!("Failed to get printer: {}", e))?;
    
    let printer_name = String::from_utf8_lossy(&printer_cmd.stdout).trim().to_string();
    
    if printer_name.is_empty() {
        return Err("No default printer found".to_string());
    }
    
    // Use PowerShell to print raw bytes directly to printer
    let print_script = format!(
        "$printer = '{}'; \
         $content = [System.IO.File]::ReadAllText('{}', [System.Text.Encoding]::UTF8); \
         $job = Start-Job -ScriptBlock {{ \
             param($p, $c) \
             Add-Type -AssemblyName System.Drawing; \
             $doc = New-Object System.Drawing.Printing.PrintDocument; \
             $doc.PrinterSettings.PrinterName = $p; \
             $lines = $c -split \"`r?`n\"; \
             $lineIndex = 0; \
             $doc.add_PrintPage({{ \
                 param($sender, $ev) \
                 $font = New-Object System.Drawing.Font('Courier New', 8); \
                 $brush = [System.Drawing.Brushes]::Black; \
                 $y = 0; \
                 $script:lineIndex = $lineIndex; \
                 while ($script:lineIndex -lt $lines.Length -and $y -lt $ev.MarginBounds.Height) {{ \
                     $line = $lines[$script:lineIndex].TrimEnd(\"`r\"); \
                     $ev.Graphics.DrawString($line, $font, $brush, 0, $y); \
                     $y += $font.GetHeight($ev.Graphics); \
                     $script:lineIndex++; \
                 }} \
                 $lineIndex = $script:lineIndex; \
                 $ev.HasMorePages = ($lineIndex -lt $lines.Length); \
             }}); \
             $doc.Print(); \
         }} -ArgumentList $printer, $content; \
         Wait-Job $job | Out-Null; \
         Receive-Job $job; \
         Remove-Job $job;",
        printer_name.replace("'", "''"),
        path_str.replace("\\", "\\\\").replace("'", "''")
    );
    
    let output = Command::new("powershell")
        .args(&["-NoProfile", "-Command", &print_script])
        .output()
        .map_err(|e| format!("Print failed: {}", e))?;
    
    if output.status.success() {
        Ok(format!("Printed to {}", printer_name))
    } else {
        let err = String::from_utf8_lossy(&output.stderr);
        Err(format!("Print failed: {}", err))
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
