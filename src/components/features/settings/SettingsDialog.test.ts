import { describe, expect, it } from 'vitest';
import { isSettingsTabVisible } from './settingsVisibility';

describe('isSettingsTabVisible', () => {
  it('should hide developer diagnostics when running in production', () => {
    expect(isSettingsTabVisible('developer', false)).toBe(false);
    expect(isSettingsTabVisible('general', false)).toBe(true);
    expect(isSettingsTabVisible('performance', false)).toBe(true);
  });

  it('should expose developer diagnostics when running in development', () => {
    expect(isSettingsTabVisible('developer', true)).toBe(true);
  });
});
