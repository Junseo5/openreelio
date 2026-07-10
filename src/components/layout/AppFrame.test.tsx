import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppFrame } from './AppFrame';

describe('AppFrame', () => {
  it('should reserve a separate region when a banner is visible', () => {
    render(
      <AppFrame banner={<div>Update available</div>}>
        <main>Editor workspace</main>
      </AppFrame>,
    );

    const banner = screen.getByTestId('app-frame-banner');
    const content = screen.getByTestId('app-frame-content');

    expect(within(banner).getByText('Update available')).toBeInTheDocument();
    expect(within(content).getByText('Editor workspace')).toBeInTheDocument();
    expect(within(content).queryByText('Update available')).not.toBeInTheDocument();
  });

  it('should omit the banner region when no banner is provided', () => {
    render(
      <AppFrame>
        <main>Welcome screen</main>
      </AppFrame>,
    );

    expect(screen.queryByTestId('app-frame-banner')).not.toBeInTheDocument();
    expect(screen.getByText('Welcome screen')).toBeInTheDocument();
  });
});
