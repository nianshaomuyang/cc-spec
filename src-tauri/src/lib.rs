use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::process::Command as StdCommand;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Clone, Serialize)]
struct SpecUpdate {
    content: String,
    path: String,
}

#[derive(Clone, Serialize)]
struct DecisionFile {
    name: String,
    path: String,
    content: String,
}

#[derive(Clone, Serialize)]
struct GitCommit {
    hash: String,
    date: String,
    message: String,
}

#[derive(Clone, Deserialize)]
struct AdrInput {
    filename: String,
    title: String,
    chosen_option: String,
    reason: String,
    original_content: String,
}

struct AppState {
    watcher: Mutex<Option<RecommendedWatcher>>,
}

#[tauri::command]
fn read_spec(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("读取文件失败: {}", e))
}

#[tauri::command]
fn list_decisions(project_path: String) -> Result<Vec<DecisionFile>, String> {
    let decisions_dir = PathBuf::from(&project_path).join("spec").join("decisions");
    if !decisions_dir.exists() {
        return Ok(vec![]);
    }

    let mut files = vec![];
    for entry in fs::read_dir(&decisions_dir)
        .map_err(|e| format!("读取 decisions 目录失败: {}", e))?
    {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().map_or(false, |ext| ext == "md") {
            let name = path
                .file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            let content = fs::read_to_string(&path).unwrap_or_default();
            files.push(DecisionFile {
                name,
                path: path.to_string_lossy().to_string(),
                content,
            });
        }
    }
    Ok(files)
}

#[tauri::command]
fn read_decision(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("读取决策文件失败: {}", e))
}

#[tauri::command]
fn save_adr(project_path: String, adr: AdrInput) -> Result<String, String> {
    let decisions_dir = PathBuf::from(&project_path).join("spec").join("decisions");
    if !decisions_dir.exists() {
        fs::create_dir_all(&decisions_dir)
            .map_err(|e| format!("创建 decisions 目录失败: {}", e))?;
    }

    let timestamp = chrono_now();
    let content = format!(
        "# {}\n\n> 归档时间：{}\n\n## 最终选择\n\n**{}**\n\n## 选择原因\n\n{}\n\n---\n\n## 原始方案记录\n\n{}\n",
        adr.title, timestamp, adr.chosen_option, adr.reason, adr.original_content
    );

    let filepath = decisions_dir.join(&adr.filename);
    fs::write(&filepath, content).map_err(|e| format!("写入 ADR 失败: {}", e))?;
    Ok(filepath.to_string_lossy().to_string())
}

#[tauri::command]
fn get_git_log(project_path: String) -> Result<Vec<GitCommit>, String> {
    let output = StdCommand::new("git")
        .args(["log", "--oneline", "--format=%H|%ai|%s", "--", "spec/SPEC.md"])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("执行 git log 失败: {}", e))?;

    if !output.status.success() {
        return Ok(vec![]);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let commits: Vec<GitCommit> = stdout
        .lines()
        .filter_map(|line| {
            let parts: Vec<&str> = line.splitn(3, '|').collect();
            if parts.len() >= 3 {
                Some(GitCommit {
                    hash: parts[0].to_string(),
                    date: parts[1].to_string(),
                    message: parts[2].to_string(),
                })
            } else {
                None
            }
        })
        .collect();

    Ok(commits)
}

#[tauri::command]
fn read_spec_at_commit(project_path: String, commit_hash: String) -> Result<String, String> {
    let output = StdCommand::new("git")
        .args(["show", &format!("{}:spec/SPEC.md", commit_hash)])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("执行 git show 失败: {}", e))?;

    if !output.status.success() {
        return Err("无法读取该版本的 SPEC.md".to_string());
    }

    String::from_utf8(output.stdout).map_err(|e| format!("解码失败: {}", e))
}

fn chrono_now() -> String {
    let output = StdCommand::new("date")
        .args(["/t"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .unwrap_or_default();
    output.trim().to_string()
}

#[tauri::command]
fn watch_spec(app: AppHandle, path: String) -> Result<(), String> {
    let spec_path = PathBuf::from(&path);
    let watch_dir = spec_path
        .parent()
        .ok_or("无法获取文件目录")?
        .to_path_buf();

    let state = app.state::<AppState>();
    let mut watcher_guard = state.watcher.lock().map_err(|e| e.to_string())?;

    *watcher_guard = None;

    let app_handle = app.clone();
    let spec_path_clone = spec_path.clone();

    let mut watcher = RecommendedWatcher::new(
        move |result: Result<Event, notify::Error>| {
            if let Ok(event) = result {
                match event.kind {
                    EventKind::Modify(_) | EventKind::Create(_) => {
                        let is_spec = event.paths.iter().any(|p| p == &spec_path_clone);
                        if is_spec {
                            if let Ok(content) = fs::read_to_string(&spec_path_clone) {
                                let _ = app_handle.emit(
                                    "spec-changed",
                                    SpecUpdate {
                                        content,
                                        path: spec_path_clone.to_string_lossy().to_string(),
                                    },
                                );
                            }
                        }
                    }
                    _ => {}
                }
            }
        },
        notify::Config::default(),
    )
    .map_err(|e| format!("创建文件监听器失败: {}", e))?;

    watcher
        .watch(&watch_dir, RecursiveMode::NonRecursive)
        .map_err(|e| format!("监听目录失败: {}", e))?;

    *watcher_guard = Some(watcher);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    std::panic::set_hook(Box::new(|info| {
        eprintln!("[ClaudeSpec Panic] {}", info);
    }));

    tauri::Builder::default()
        .manage(AppState {
            watcher: Mutex::new(None),
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .setup(|_app| {
            log::info!("[ClaudeSpec] 应用启动中...");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            read_spec,
            watch_spec,
            list_decisions,
            read_decision,
            save_adr,
            get_git_log,
            read_spec_at_commit
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
