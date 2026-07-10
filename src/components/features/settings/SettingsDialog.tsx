/**
 * SettingsDialog Component
 *
 * Modal dialog for application settings with tabbed navigation.
 */

import { lazy, Suspense, useEffect, useCallback } from 'react';
import {
  X,
  Settings2,
  Palette,
  Keyboard,
  RotateCcw,
  Bot,
  Shield,
  Wrench,
  Play,
  Gauge,
  Terminal,
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useUIStore } from '@/stores';
import type { SettingsTab } from '@/stores/uiStore';
import { ModalShell } from '@/components/ui';
import { getUserFriendlyError } from '@/utils/errorMessages';
import { GeneralSettings } from './sections/GeneralSettings';
import { AppearanceSettings } from './sections/AppearanceSettings';
import { ShortcutsSettings } from './sections/ShortcutsSettings';
import { AISettingsSection } from './sections/AISettingsSection';
import { AgentPermissionsSection } from './sections/AgentPermissionsSection';
import { PlaybackSettings } from './sections/PlaybackSettings';
import { PerformanceSettings } from './sections/PerformanceSettings';
import { TerminalSettings } from './sections/TerminalSettings';
import { isSettingsTabVisible } from './settingsVisibility';

const DeveloperSettings = import.meta.env.DEV
  ? lazy(async () => {
      const module = await import('./sections/DeveloperSettings');
      return { default: module.DeveloperSettings };
    })
  : null;

// =============================================================================
// Types
// =============================================================================

export interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Tab {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
}

// =============================================================================
// Constants
// =============================================================================

const STANDARD_TABS: Tab[] = [
  { id: 'general', label: 'General', icon: <Settings2 className="w-4 h-4" /> },
  { id: 'playback', label: 'Playback', icon: <Play className="w-4 h-4" /> },
  { id: 'performance', label: 'Performance', icon: <Gauge className="w-4 h-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
  { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard className="w-4 h-4" /> },
  { id: 'terminal', label: 'Terminal', icon: <Terminal className="w-4 h-4" /> },
  { id: 'ai', label: 'AI', icon: <Bot className="w-4 h-4" /> },
  { id: 'permissions', label: 'Permissions', icon: <Shield className="w-4 h-4" /> },
];

const DEVELOPER_TAB: Tab = {
  id: 'developer',
  label: 'Developer',
  icon: <Wrench className="w-4 h-4" />,
};

const ALL_TABS = [...STANDARD_TABS, DEVELOPER_TAB];

// =============================================================================
// Component
// =============================================================================

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const activeTab = useUIStore((state) => state.settingsActiveTab);
  const setActiveTab = useUIStore((state) => state.setSettingsTab);
  const visibleTabs = ALL_TABS.filter((tab) => isSettingsTabVisible(tab.id, import.meta.env.DEV));
  const visibleActiveTab =
    activeTab === 'developer' && !import.meta.env.DEV ? 'general' : activeTab;

  const {
    general,
    playback,
    performance,
    appearance,
    ai,
    terminal,
    updateGeneral,
    updatePlayback,
    updatePerformance,
    updateAppearance,
    updateAI,
    updateTerminal,
    resetSettings,
    isSaving,
    error,
    clearError,
  } = useSettings();
  const visibleError = error
    ? getUserFriendlyError(error, { includeTechnicalDetails: import.meta.env.DEV })
    : null;

  // Clear error when dialog opens (tab is already set by openSettings)
  useEffect(() => {
    if (isOpen) {
      clearError();
    }
  }, [isOpen, clearError]);

  useEffect(() => {
    if (isOpen && activeTab === 'developer' && !import.meta.env.DEV) {
      setActiveTab('general');
    }
  }, [activeTab, isOpen, setActiveTab]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  const handleReset = useCallback(async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      await resetSettings();
    }
  }, [resetSettings]);

  const handleGeneralUpdate = useCallback(
    (values: Parameters<typeof updateGeneral>[0]) => {
      void updateGeneral(values);
    },
    [updateGeneral],
  );

  const handlePlaybackUpdate = useCallback(
    (values: Parameters<typeof updatePlayback>[0]) => {
      void updatePlayback(values);
    },
    [updatePlayback],
  );

  const handleAppearanceUpdate = useCallback(
    (values: Parameters<typeof updateAppearance>[0]) => {
      void updateAppearance(values);
    },
    [updateAppearance],
  );

  const handlePerformanceUpdate = useCallback(
    (values: Parameters<typeof updatePerformance>[0]) => {
      void updatePerformance(values);
    },
    [updatePerformance],
  );

  const handleAIUpdate = useCallback(
    (values: Parameters<typeof updateAI>[0]) => {
      void updateAI(values);
    },
    [updateAI],
  );

  const handleTerminalUpdate = useCallback(
    (values: Parameters<typeof updateTerminal>[0]) => {
      void updateTerminal(values);
    },
    [updateTerminal],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <ModalShell
      ariaLabelledBy="settings-title"
      onRequestClose={onClose}
      onKeyDown={handleKeyDown}
      widthClassName="max-w-2xl"
      overlayClassName="bg-black/60"
      dialogClassName="max-h-[80dvh] rounded-xl border border-editor-border bg-editor-panel shadow-2xl"
      bodyClassName="!overflow-hidden"
      testId="settings-dialog"
      header={
        <div className="flex items-center justify-between px-6 py-4 border-b border-editor-border shrink-0">
          <h2 id="settings-title" className="text-lg font-semibold text-editor-text">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-editor-bg transition-colors text-editor-text-muted hover:text-editor-text"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3 rounded-b-xl border-t border-editor-border bg-editor-sidebar/50 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={isSaving}
            className="flex min-w-0 items-center gap-2 px-3 py-1.5 text-sm text-editor-text-muted transition-colors hover:text-editor-text disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4 shrink-0" />
            <span className="truncate">Reset to Defaults</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white transition-colors hover:bg-primary-700"
          >
            Done
          </button>
        </div>
      }
    >
      <div className="flex h-full min-h-0 min-w-0">
        {/* Tab Navigation */}
        <nav
          aria-label="Settings sections"
          className="w-14 shrink-0 overflow-y-auto border-r border-editor-border p-2 sm:w-44"
        >
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              aria-current={visibleActiveTab === tab.id ? 'page' : undefined}
              className={`
                  flex w-full items-center justify-center gap-3 rounded-lg px-2 py-2 text-left transition-colors sm:justify-start sm:px-3
                  ${
                    visibleActiveTab === tab.id
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-editor-text-muted hover:bg-editor-bg hover:text-editor-text'
                  }
                `}
            >
              <span className="shrink-0" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="hidden min-w-0 truncate text-sm sm:block">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Error Display */}
          {visibleError && (
            <div className="mb-4 min-w-0 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="max-w-full break-words text-sm text-red-400 [overflow-wrap:anywhere]">
                {visibleError}
              </p>
            </div>
          )}

          {/* Saving Indicator */}
          {isSaving && (
            <div className="mb-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
              <p className="text-sm text-primary-400">Saving settings...</p>
            </div>
          )}

          {visibleActiveTab === 'general' && (
            <GeneralSettings
              settings={general}
              onUpdate={handleGeneralUpdate}
              disabled={isSaving}
            />
          )}

          {visibleActiveTab === 'playback' && (
            <PlaybackSettings
              settings={playback}
              onUpdate={handlePlaybackUpdate}
              disabled={isSaving}
            />
          )}

          {visibleActiveTab === 'performance' && (
            <PerformanceSettings
              settings={performance}
              onUpdate={handlePerformanceUpdate}
              disabled={isSaving}
            />
          )}

          {visibleActiveTab === 'appearance' && (
            <AppearanceSettings
              settings={appearance}
              onUpdate={handleAppearanceUpdate}
              disabled={isSaving}
            />
          )}

          {visibleActiveTab === 'shortcuts' && <ShortcutsSettings />}

          {visibleActiveTab === 'terminal' && (
            <TerminalSettings
              settings={terminal}
              onUpdate={handleTerminalUpdate}
              disabled={isSaving}
            />
          )}

          {visibleActiveTab === 'ai' && (
            <AISettingsSection settings={ai} onUpdate={handleAIUpdate} disabled={isSaving} />
          )}

          {visibleActiveTab === 'permissions' && <AgentPermissionsSection />}

          {visibleActiveTab === 'developer' && DeveloperSettings && (
            <Suspense fallback={null}>
              <DeveloperSettings />
            </Suspense>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

export default SettingsDialog;
