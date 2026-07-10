/**
 * UpdateBanner Component
 *
 * Banner displayed when an application update is available.
 * Shows progress during download and prompts for restart when ready.
 */

import { Download, RefreshCw, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useUpdate, type UseUpdateReturn } from '@/hooks/useUpdate';
import { getUserFriendlyError } from '@/utils/errorMessages';

export interface UpdateBannerProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether to show on mount (respects settings) */
  checkOnMount?: boolean;
}

interface UpdateBannerContentProps {
  update: UseUpdateReturn;
  className?: string;
}

export function UpdateBannerContent({ update, className = '' }: UpdateBannerContentProps) {
  const {
    updateInfo,
    isChecking,
    isInstalling,
    error,
    updateAvailable,
    needsRestart,
    installUpdate,
    relaunch,
    clearError,
    checkForUpdates,
  } = update;

  // Don't render anything if no update info and not checking/error
  if (!isChecking && !error && !updateAvailable && !needsRestart) {
    return null;
  }

  // Checking state
  if (isChecking) {
    return (
      <div className={`bg-editor-sidebar border-b border-editor-border px-4 py-2 ${className}`}>
        <div className="flex items-center gap-3 text-sm text-editor-text-muted">
          <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
          <span>Checking for updates...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const visibleError = getUserFriendlyError(error, { includeTechnicalDetails: false });

    return (
      <div className={`bg-red-500/10 border-b border-red-500/20 px-4 py-2 ${className}`}>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="break-words [overflow-wrap:anywhere]">
              Failed to check for updates. {visibleError}
            </span>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              onClick={() => void checkForUpdates()}
              className="px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={clearError}
              className="p-1 text-red-400 hover:text-red-300 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Needs restart state
  if (needsRestart) {
    return (
      <div className={`bg-green-500/10 border-b border-green-500/20 px-4 py-2 ${className}`}>
        <div className="flex flex-wrap items-center gap-3 sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3 text-sm text-green-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Update installed successfully. Restart to complete.</span>
          </div>
          <button
            onClick={() => void relaunch()}
            className="ml-auto shrink-0 rounded bg-green-600 px-3 py-1 text-sm text-white transition-colors hover:bg-green-700"
          >
            Restart Now
          </button>
        </div>
      </div>
    );
  }

  // Installing state
  if (isInstalling) {
    return (
      <div className={`bg-primary-500/10 border-b border-primary-500/20 px-4 py-2 ${className}`}>
        <div className="flex items-center gap-3 text-sm text-primary-400">
          <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
          <span>Downloading and installing update...</span>
        </div>
      </div>
    );
  }

  // Update available state
  if (updateAvailable && updateInfo) {
    return (
      <div className={`bg-primary-500/10 border-b border-primary-500/20 px-4 py-2 ${className}`}>
        <div className="flex flex-wrap items-center gap-3 sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3 text-sm text-primary-400">
            <Download className="h-4 w-4 shrink-0" />
            <span className="break-words">
              Version {updateInfo.latestVersion} is available
              {updateInfo.currentVersion && ` (current: ${updateInfo.currentVersion})`}
            </span>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <button
              onClick={() => void installUpdate()}
              className="px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
            >
              Update Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function UpdateBanner({ className = '', checkOnMount = true }: UpdateBannerProps) {
  const update = useUpdate({ checkOnMount });
  return <UpdateBannerContent update={update} className={className} />;
}

export default UpdateBanner;
