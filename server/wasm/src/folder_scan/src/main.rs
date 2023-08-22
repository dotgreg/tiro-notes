use std::io::prelude::*;
use std::fs;

fn main() {
    let folder_path = "/f";
    let mut file = fs::File::create("/app/folder_scan.log").unwrap();

    let subfolders = scan_subfolders(folder_path);
    let json_string = serde_json::json!({
        "folders": subfolders,
    })
    .to_string();

    writeln!(file, "{}", json_string).unwrap();

    println!("RUST:folder_scan >> Subfolder scanning completed");
}

fn scan_subfolders(folder_path: &str) -> Vec<String> {
    let mut subfolders = Vec::new();

    if let Ok(entries) = fs::read_dir(folder_path) {
        for entry in entries {
            let entry = entry.expect("Failed to read directory entry");
            let entry_file_name = entry.file_name();

            if let Some(subfolder_name) = entry_file_name.to_str() {
                let subfolder_path = format!("{}/{}", folder_path, subfolder_name);

                // Check if subfolder path is blacklisted
                // Check if subfolder path is a directory
                if let Ok(metadata) = fs::metadata(&subfolder_path) {
                    if metadata.is_dir() && !is_blacklisted(&subfolder_name) {
                        subfolders.push(subfolder_path.clone());

                        // Recursively scan subfolders
                        let subfolder_subfolders = scan_subfolders(&subfolder_path);
                        subfolders.extend(subfolder_subfolders);
                    }
                }
            }
        }
    }

    subfolders
}

fn is_blacklisted(folder_name: &str) -> bool {
    let blacklist = [".resources", "_resources", ".history"];
    blacklist.contains(&folder_name)
}