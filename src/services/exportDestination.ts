/**
 * Export destination service.
 *
 * Wraps the `pick_export_destination` Tauri command, which opens a native save
 * dialog in the Rust backend and records the chosen parent directory in a
 * session-scoped allow-list. Using this command (instead of the frontend
 * `@tauri-apps/plugin-dialog` `save()`) is what lets the backend accept exports
 * to user-chosen locations outside the default allowed roots, without weakening
 * the IPC trust boundary: only directories the user confirms here become writable.
 */

import { invoke } from '@tauri-apps/api/core';

/** A file type filter shown in the native save dialog. */
export interface ExportDestinationFilter {
  /** Human-readable filter name (e.g., "Video"). */
  name: string;
  /** File extensions without the leading dot (e.g., ["mp4"]). */
  extensions: string[];
}

/** Arguments for {@link pickExportDestination}. */
export interface PickExportDestinationArgs {
  /** Suggested file name pre-filled in the dialog. */
  defaultName: string;
  /** File type filters shown in the dialog. */
  filters: ExportDestinationFilter[];
  /** Optional title shown on the native save dialog. */
  title?: string;
}

/**
 * Opens the native save dialog for an export destination.
 *
 * @returns The absolute path the user selected, or `null` if the dialog was cancelled.
 */
export async function pickExportDestination(args: PickExportDestinationArgs): Promise<string | null> {
  const selected = await invoke<string | null>('pick_export_destination', {
    defaultName: args.defaultName,
    filters: args.filters,
    title: args.title,
  });
  return selected ?? null;
}
