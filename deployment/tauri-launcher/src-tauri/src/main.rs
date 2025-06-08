use tauri::{CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, Manager, Window};
use std::process::{Command, Stdio, Child};
use std::sync::{Mutex, Arc};
use std::collections::HashMap;
use std::thread;
use std::time::Duration;
use tauri::State;
use serde::{Deserialize, Serialize};
use std::net::TcpListener;
use std::path::PathBuf;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AppInfo {
    name: String,
    port: u16,
    status: String,
    process_id: Option<u32>,
    started_at: DateTime<Utc>,
    health_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DeploymentConfig {
    deployment_type: String,
    app_name: String,
    port: Option<u16>,
    environment: String,
    enable_ssl: bool,
    enable_monitoring: bool,
    enable_ai_agents: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SystemInfo {
    platform: String,
    arch: String,
    memory_total: u64,
    memory_available: u64,
    cpu_count: usize,
    disk_space_available: u64,
}

struct AppState {
    apps: Arc<Mutex<HashMap<String, AppInfo>>>,
    processes: Arc<Mutex<HashMap<String, Child>>>,
    deployment_config: Arc<Mutex<Option<DeploymentConfig>>>,
    system_info: Arc<Mutex<Option<SystemInfo>>>,
}

#[tauri::command]
async fn launch_app(
    app_name: String, 
    config: Option<DeploymentConfig>,
    state: State<'_, AppState>,
    window: Window
) -> Result<AppInfo, String> {
    let apps_path = get_apps_directory();
    let script_path = if cfg!(target_os = "windows") {
        format!("{}/{}/run.bat", apps_path.display(), app_name)
    } else {
        format!("{}/{}/run.sh", apps_path.display(), app_name)
    };

    // Check if script exists
    if !std::path::Path::new(&script_path).exists() {
        return Err(format!("Launch script not found: {}", script_path));
    }

    let mut apps = state.apps.lock().unwrap();
    let mut processes = state.processes.lock().unwrap();

    // Check if app is already running
    if apps.contains_key(&app_name) {
        return Err(format!("App {} is already running", app_name));
    }

    // Find available port
    let port = if let Some(cfg) = &config {
        cfg.port.unwrap_or_else(|| find_free_port(8000, &apps))
    } else {
        find_free_port(8000, &apps)
    };

    if port == 0 {
        return Err("No free ports available".into());
    }

    // Prepare environment variables
    let mut env_vars = vec![
        ("PORT".to_string(), port.to_string()),
        ("NODE_ENV".to_string(), "production".to_string()),
        ("TAURI_DEPLOYMENT".to_string(), "true".to_string()),
    ];

    if let Some(cfg) = &config {
        env_vars.push(("DEPLOYMENT_TYPE".to_string(), cfg.deployment_type.clone()));
        env_vars.push(("APP_NAME".to_string(), cfg.app_name.clone()));
        env_vars.push(("ENVIRONMENT".to_string(), cfg.environment.clone()));
        env_vars.push(("ENABLE_SSL".to_string(), cfg.enable_ssl.to_string()));
        env_vars.push(("ENABLE_MONITORING".to_string(), cfg.enable_monitoring.to_string()));
        env_vars.push(("ENABLE_AI_AGENTS".to_string(), cfg.enable_ai_agents.to_string()));
    }

    // Launch the process
    let mut command = if cfg!(target_os = "windows") {
        Command::new("cmd")
    } else {
        Command::new("sh")
    };

    if cfg!(target_os = "windows") {
        command.args(["/C", &script_path]);
    } else {
        command.args(["-c", &format!("chmod +x {} && {}", script_path, script_path)]);
    }

    for (key, value) in env_vars {
        command.env(key, value);
    }

    command.stdout(Stdio::piped()).stderr(Stdio::piped());

    match command.spawn() {
        Ok(child) => {
            let process_id = child.id();
            let app_info = AppInfo {
                name: app_name.clone(),
                port,
                status: "starting".to_string(),
                process_id: Some(process_id),
                started_at: Utc::now(),
                health_url: Some(format!("http://localhost:{}/api/health", port)),
            };

            apps.insert(app_name.clone(), app_info.clone());
            processes.insert(app_name.clone(), child);

            // Emit event to frontend
            let _ = window.emit("app_launched", &app_info);

            // Start health check monitoring
            let app_name_clone = app_name.clone();
            let port_clone = port;
            let state_clone = state.inner().clone();
            let window_clone = window.clone();
            
            tauri::async_runtime::spawn(async move {
                monitor_app_health(app_name_clone, port_clone, state_clone, window_clone).await;
            });

            Ok(app_info)
        }
        Err(e) => Err(format!("Failed to launch {}: {}", app_name, e)),
    }
}

#[tauri::command]
async fn stop_app(app_name: String, state: State<'_, AppState>) -> Result<String, String> {
    let mut apps = state.apps.lock().unwrap();
    let mut processes = state.processes.lock().unwrap();

    if let Some(mut process) = processes.remove(&app_name) {
        match process.kill() {
            Ok(_) => {
                apps.remove(&app_name);
                Ok(format!("Successfully stopped {}", app_name))
            }
            Err(e) => Err(format!("Failed to stop {}: {}", app_name, e))
        }
    } else {
        Err(format!("App {} is not running", app_name))
    }
}

#[tauri::command]
async fn get_running_apps(state: State<'_, AppState>) -> Result<Vec<AppInfo>, String> {
    let apps = state.apps.lock().unwrap();
    Ok(apps.values().cloned().collect())
}

#[tauri::command]
async fn get_system_info(state: State<'_, AppState>) -> Result<SystemInfo, String> {
    let mut system_info_guard = state.system_info.lock().unwrap();
    
    if system_info_guard.is_none() {
        let info = collect_system_info();
        *system_info_guard = Some(info);
    }
    
    Ok(system_info_guard.as_ref().unwrap().clone())
}

#[tauri::command]
async fn save_deployment_config(
    config: DeploymentConfig, 
    state: State<'_, AppState>
) -> Result<String, String> {
    let mut deployment_config = state.deployment_config.lock().unwrap();
    *deployment_config = Some(config);
    Ok("Configuration saved successfully".to_string())
}

#[tauri::command]
async fn get_deployment_config(state: State<'_, AppState>) -> Result<Option<DeploymentConfig>, String> {
    let deployment_config = state.deployment_config.lock().unwrap();
    Ok(deployment_config.clone())
}

#[tauri::command]
async fn check_app_health(app_name: String, state: State<'_, AppState>) -> Result<bool, String> {
    let apps = state.apps.lock().unwrap();
    
    if let Some(app_info) = apps.get(&app_name) {
        if let Some(health_url) = &app_info.health_url {
            match reqwest::get(health_url).await {
                Ok(response) => Ok(response.status().is_success()),
                Err(_) => Ok(false),
            }
        } else {
            Ok(false)
        }
    } else {
        Err(format!("App {} not found", app_name))
    }
}

#[tauri::command]
async fn open_app_url(app_name: String, state: State<'_, AppState>) -> Result<String, String> {
    let apps = state.apps.lock().unwrap();
    
    if let Some(app_info) = apps.get(&app_name) {
        let url = format!("http://localhost:{}", app_info.port);
        match tauri::api::shell::open(&url, None) {
            Ok(_) => Ok(format!("Opened {} in browser", url)),
            Err(e) => Err(format!("Failed to open URL: {}", e))
        }
    } else {
        Err(format!("App {} not found", app_name))
    }
}

fn find_free_port(start: u16, apps: &HashMap<String, AppInfo>) -> u16 {
    let used_ports: Vec<u16> = apps.values().map(|app| app.port).collect();
    
    for port in start..9000 {
        if !used_ports.contains(&port) {
            if let Ok(_) = TcpListener::bind(format!("127.0.0.1:{}", port)) {
                return port;
            }
        }
    }
    0 // No port found
}

fn get_apps_directory() -> PathBuf {
    if let Some(exe_dir) = std::env::current_exe().ok().and_then(|p| p.parent().map(|p| p.to_path_buf())) {
        exe_dir.join("apps")
    } else {
        PathBuf::from("apps")
    }
}

fn collect_system_info() -> SystemInfo {
    let memory_info = sys_info::mem_info().unwrap_or_default();
    let cpu_count = sys_info::cpu_num().unwrap_or(1);
    let disk_info = sys_info::disk_info().unwrap_or_default();
    
    SystemInfo {
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        memory_total: memory_info.total * 1024, // Convert to bytes
        memory_available: memory_info.avail * 1024,
        cpu_count: cpu_count as usize,
        disk_space_available: disk_info.free,
    }
}

async fn monitor_app_health(app_name: String, port: u16, state: Arc<AppState>, window: Window) {
    let health_url = format!("http://localhost:{}/api/health", port);
    let mut check_count = 0;
    let max_checks = 30; // 5 minutes of checks

    loop {
        thread::sleep(Duration::from_secs(10));
        check_count += 1;

        let health_check = reqwest::get(&health_url).await;
        let mut apps = state.apps.lock().unwrap();
        
        if let Some(app_info) = apps.get_mut(&app_name) {
            match health_check {
                Ok(response) if response.status().is_success() => {
                    app_info.status = "running".to_string();
                    let _ = window.emit("app_status_changed", &*app_info);
                    break; // App is healthy, stop monitoring startup
                }
                _ => {
                    if check_count >= max_checks {
                        app_info.status = "failed".to_string();
                        let _ = window.emit("app_status_changed", &*app_info);
                        break;
                    }
                    app_info.status = "starting".to_string();
                }
            }
        } else {
            break; // App removed from list
        }
    }
}

fn create_system_tray() -> SystemTray {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show", "Show TerraFusion Launcher"))
        .add_item(CustomMenuItem::new("apps", "Running Apps"))
        .add_separator()
        .add_item(CustomMenuItem::new("quit", "Quit"));

    SystemTray::new().with_menu(tray_menu)
}

fn handle_system_tray_event(app: &tauri::AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::MenuItemClick { id, .. } => {
            match id.as_str() {
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "apps" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = window.emit("show_apps", ());
                    }
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            }
        }
        _ => {}
    }
}

fn main() {
    let app_state = AppState {
        apps: Arc::new(Mutex::new(HashMap::new())),
        processes: Arc::new(Mutex::new(HashMap::new())),
        deployment_config: Arc::new(Mutex::new(None)),
        system_info: Arc::new(Mutex::new(None)),
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            launch_app,
            stop_app,
            get_running_apps,
            get_system_info,
            save_deployment_config,
            get_deployment_config,
            check_app_health,
            open_app_url
        ])
        .system_tray(create_system_tray())
        .on_system_tray_event(handle_system_tray_event)
        .on_window_event(|event| {
            match event.event() {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    event.window().hide().unwrap();
                    api.prevent_close();
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}