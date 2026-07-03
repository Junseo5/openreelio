//! Export destination picker command.
//!
//! Exposes a native save dialog to the frontend and records the chosen parent
//! directory in a session-scoped allow-list (`AppState::approved_export_dirs`).
//!
//! Security rationale:
//! - IPC is a trust boundary; a compromised renderer (webview) could forge output
//!   paths. Export commands therefore restrict writes to `default_export_allowed_roots`
//!   plus the directories the user explicitly confirmed here.
//! - The allow-list can ONLY be widened through this command, which requires a real
//!   user interaction (the native dialog). The renderer cannot inject a path argument
//!   that bypasses validation: the approved directory is derived from the dialog
//!   result, not from any renderer-supplied value.

use specta::Type;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

use crate::AppState;
use tauri::Manager;

/// A file type filter for the native save dialog (IPC DTO).
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize, Type)]
pub struct ExportDialogFilter {
    /// Human-readable filter name (e.g., "Video").
    pub name: String,
    /// File extensions associated with the filter, without the leading dot (e.g., ["mp4"]).
    pub extensions: Vec<String>,
}

/// Opens a native save dialog for an export destination.
///
/// On confirmation, the parent directory of the chosen path is normalized and added
/// to the session-scoped approved-export allow-list, then the absolute path is
/// returned. On cancel, returns `Ok(None)`.
///
/// # Arguments
/// * `default_name` - Suggested file name pre-filled in the dialog.
/// * `filters` - File type filters shown in the dialog.
/// * `title` - Optional title shown on the native save dialog.
#[tauri::command]
#[specta::specta]
pub async fn pick_export_destination(
    default_name: String,
    filters: Vec<ExportDialogFilter>,
    title: Option<String>,
    app_handle: AppHandle,
) -> Result<Option<String>, String> {
    // Run the native save dialog off the async runtime via its callback API,
    // bridging the result back with a oneshot channel so we never block a runtime worker.
    let (tx, rx) = tokio::sync::oneshot::channel();

    let mut builder = app_handle.dialog().file();
    if !default_name.trim().is_empty() {
        builder = builder.set_file_name(default_name);
    }
    if let Some(dialog_title) = title {
        if !dialog_title.trim().is_empty() {
            builder = builder.set_title(dialog_title);
        }
    }
    for filter in &filters {
        let extension_refs: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
        builder = builder.add_filter(filter.name.clone(), &extension_refs);
    }

    builder.save_file(move |file_path| {
        // Ignore send errors: the receiver is only dropped if the command future was
        // cancelled, in which case there is nothing left to deliver the result to.
        let _ = tx.send(file_path);
    });

    let selected = rx
        .await
        .map_err(|_| "Export dialog was closed unexpectedly".to_string())?;

    let Some(file_path) = selected else {
        // User cancelled the dialog.
        return Ok(None);
    };

    let path = file_path
        .into_path()
        .map_err(|e| format!("Failed to resolve selected export path: {e}"))?;

    let parent = path
        .parent()
        .ok_or_else(|| {
            format!(
                "Selected export path has no parent directory: {}",
                path.display()
            )
        })?
        .to_path_buf();

    // Normalize the parent directory before approving it. Canonicalization resolves
    // symlinks and `..` segments so the later scope check in `validate_scoped_output_path`
    // matches; fall back to the lexical parent if canonicalization fails (best-effort).
    let approved_dir = match std::fs::canonicalize(&parent) {
        Ok(canonical) => canonical,
        Err(error) => {
            tracing::warn!(
                "Failed to canonicalize approved export directory '{}' (using as-is): {}",
                parent.display(),
                error
            );
            parent
        }
    };

    let state = app_handle.state::<AppState>();
    state.approve_export_dir(approved_dir).await;

    Ok(Some(path.to_string_lossy().to_string()))
}
