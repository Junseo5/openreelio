import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { UseUpdateReturn } from '@/hooks/useUpdate';
import { UpdateBannerContent } from './UpdateBanner';

describe('UpdateBannerContent', () => {
  it('should replace raw update errors when an update check fails', () => {
    const update = {
      updateInfo: null,
      isChecking: false,
      isInstalling: false,
      error: 'GET C:/Users/private/AppData/update.json?token=secret-value failed',
      updateAvailable: false,
      needsRestart: false,
      installUpdate: vi.fn(),
      relaunch: vi.fn(),
      clearError: vi.fn(),
      checkForUpdates: vi.fn(),
    } satisfies UseUpdateReturn;

    render(<UpdateBannerContent update={update} />);

    expect(screen.getByText(/Failed to check for updates/i)).toHaveTextContent(
      'Could not complete the operation.',
    );
    expect(screen.queryByText(/secret-value/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Users\/private/i)).not.toBeInTheDocument();
  });
});
