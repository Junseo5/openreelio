import type { SettingsTab } from '@/stores/uiStore';

/** Keep diagnostic-only settings out of production navigation and routing. */
export function isSettingsTabVisible(tabId: SettingsTab, isDevelopment: boolean): boolean {
  return tabId !== 'developer' || isDevelopment;
}
