use serde::Serialize;

#[derive(Serialize)]
struct FileEntry {
    name: String,
    is_dir: bool,
}

#[tauri::command]
fn scan_folder(path: String) -> Result<Vec<FileEntry>, String> {
    let entries = std::fs::read_dir(&path).map_err(|e| e.to_string())?;
    let mut files: Vec<FileEntry> = entries
        .filter_map(|e| e.ok())
        .map(|e| FileEntry {
            name: e.file_name().to_string_lossy().to_string(),
            is_dir: e.file_type().map(|t| t.is_dir()).unwrap_or(false),
        })
        .collect();
    files.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(files)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![scan_folder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
