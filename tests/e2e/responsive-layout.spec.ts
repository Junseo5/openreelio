import { expect, test, type Page } from '@playwright/test';

const EDITOR_VIEWPORTS = [
  { width: 1024, height: 768, label: 'minimum desktop window' },
  { width: 1280, height: 720, label: 'current browser baseline' },
  { width: 1400, height: 900, label: 'default desktop window' },
  { width: 1920, height: 1080, label: 'large desktop window' },
] as const;

async function dismissBlockingFfmpegWarning(page: Page): Promise<void> {
  const warning = page.locator('[data-testid="ffmpeg-warning"]');
  if (!(await warning.isVisible().catch(() => false))) return;

  const dismissButton = warning.locator('[data-testid="ffmpeg-warning-dismiss"]');
  if (await dismissButton.isVisible().catch(() => false)) {
    await dismissButton.click();
  } else {
    const backdrop = page.locator('[data-testid="ffmpeg-warning-backdrop"]');
    if (await backdrop.isVisible().catch(() => false)) {
      await backdrop.click({ position: { x: 8, y: 8 } });
    } else {
      await page.keyboard.press('Escape');
    }
  }
  await expect(warning).toBeHidden();
}

async function seedResponsiveEditor(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__OPENREELIO_E2E__), null, {
    timeout: 15_000,
  });
  await dismissBlockingFfmpegWarning(page);

  const origin = new URL(page.url()).origin;
  await page.evaluate((baseUrl) => {
    const hooks = window.__OPENREELIO_E2E__;
    if (!hooks) throw new Error('OpenReelio E2E hooks are not available.');

    const now = new Date().toISOString();
    const fixtureUrl = `${baseUrl}/tests/e2e/fixtures/sample-video.mp4`;
    const asset = {
      id: 'asset_responsive_layout',
      kind: 'video' as const,
      name: 'sample-video.mp4',
      uri: fixtureUrl,
      hash: 'responsive-layout-hash',
      fileSize: 1024,
      durationSec: 10,
      importedAt: now,
      video: {
        width: 1280,
        height: 720,
        fps: { num: 30, den: 1 },
        codec: 'h264',
        hasAlpha: false,
      },
      license: {
        source: 'user' as const,
        licenseType: 'unknown',
        allowedUse: [],
      },
      tags: [],
      proxyStatus: 'ready' as const,
      proxyUrl: fixtureUrl,
    };
    const clip = {
      id: 'clip_responsive_layout',
      assetId: asset.id,
      range: { sourceInSec: 0, sourceOutSec: 5 },
      place: { timelineInSec: 0, durationSec: 5 },
      transform: {
        position: { x: 0.5, y: 0.5 },
        scale: { x: 1, y: 1 },
        rotationDeg: 0,
        anchor: { x: 0.5, y: 0.5 },
      },
      opacity: 1,
      speed: 1,
      effects: [],
      audio: { volumeDb: 0, pan: 0, muted: false },
    };
    const sequence = {
      id: 'sequence_responsive_layout',
      name: 'Responsive layout verification sequence',
      format: {
        canvas: { width: 1920, height: 1080 },
        fps: { num: 30, den: 1 },
        audioSampleRate: 48_000,
        audioChannels: 2,
      },
      tracks: [
        {
          id: 'track_video_responsive',
          kind: 'video' as const,
          name: 'Video 1',
          clips: [clip],
          blendMode: 'normal' as const,
          muted: false,
          locked: false,
          visible: true,
          volume: 1,
        },
        {
          id: 'track_audio_responsive',
          kind: 'audio' as const,
          name: 'Audio 1',
          clips: [],
          blendMode: 'normal' as const,
          muted: false,
          locked: false,
          visible: true,
          volume: 1,
        },
        {
          id: 'track_caption_responsive',
          kind: 'caption' as const,
          name: 'Captions',
          clips: [],
          blendMode: 'normal' as const,
          muted: false,
          locked: false,
          visible: true,
          volume: 1,
        },
      ],
      markers: [],
    };

    hooks.seedProxyPreviewState({
      project: {
        id: 'project_responsive_layout',
        name: 'Responsive Layout Project',
        path: 'C:\\Projects\\responsive-layout',
        createdAt: now,
        modifiedAt: now,
      },
      assets: [asset],
      sequences: [sequence],
      activeSequenceId: sequence.id,
      selectedAssetId: asset.id,
      playback: {
        currentTime: 0,
        duration: 60,
        isPlaying: false,
        playbackRate: 1,
        volume: 1,
        isMuted: false,
        loop: false,
        syncWithTimeline: true,
      },
      activePanel: { zoneId: 'center-top', panelId: 'program-monitor' },
    });
  }, origin);

  await dismissBlockingFfmpegWarning(page);
  await expect(page.locator('[data-testid="dock-zone-center-top"]')).toBeVisible({
    timeout: 30_000,
  });
}

for (const viewport of EDITOR_VIEWPORTS) {
  test(`should keep the editor inside the viewport at the ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await seedResponsiveEditor(page);

    const metrics = await page.evaluate(() => {
      const readRect = (element: HTMLElement | null) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          clientWidth: element.clientWidth,
          clientHeight: element.clientHeight,
          scrollWidth: element.scrollWidth,
          scrollHeight: element.scrollHeight,
        };
      };
      const frame = document.querySelector<HTMLElement>('[data-testid="app-frame"]');
      const playerControls = document.querySelector<HTMLElement>('[data-testid="player-controls"]');
      const player = [
        '[data-testid="unified-preview-player"]',
        '[data-testid="timeline-preview-player"]',
        '[data-testid="proxy-preview-player"]',
        '[data-testid="preview-player"]',
      ]
        .flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)))
        .find((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
      const zones = Array.from(document.querySelectorAll<HTMLElement>('[data-dock-zone-id]')).map(
        (element) => {
          return {
            id: element.dataset.dockZoneId ?? 'unknown',
            rect: readRect(element),
          };
        },
      );

      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        document: {
          clientWidth: document.documentElement.clientWidth,
          clientHeight: document.documentElement.clientHeight,
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
        },
        frame: readRect(frame),
        player: readRect(player ?? null),
        playerControls: readRect(playerControls),
        zones,
      };
    });

    const assertInsideViewport = (rect: NonNullable<typeof metrics.frame>, label: string): void => {
      expect(rect.width, `${label} has no usable width`).toBeGreaterThan(0);
      expect(rect.height, `${label} has no usable height`).toBeGreaterThan(0);
      expect(rect.left, `${label} crosses the left viewport edge`).toBeGreaterThanOrEqual(-1);
      expect(rect.top, `${label} crosses the top viewport edge`).toBeGreaterThanOrEqual(-1);
      expect(rect.right, `${label} crosses the right viewport edge`).toBeLessThanOrEqual(
        metrics.viewport.width + 1,
      );
      expect(rect.bottom, `${label} crosses the bottom viewport edge`).toBeLessThanOrEqual(
        metrics.viewport.height + 1,
      );
    };

    const assertNoSelfOverflow = (rect: NonNullable<typeof metrics.frame>, label: string): void => {
      expect(rect.scrollWidth, `${label} overflows horizontally`).toBeLessThanOrEqual(
        rect.clientWidth + 1,
      );
      expect(rect.scrollHeight, `${label} overflows vertically`).toBeLessThanOrEqual(
        rect.clientHeight + 1,
      );
    };

    expect(metrics.frame).not.toBeNull();
    expect(metrics.document.scrollWidth).toBeLessThanOrEqual(metrics.document.clientWidth + 1);
    expect(metrics.document.scrollHeight).toBeLessThanOrEqual(metrics.document.clientHeight + 1);
    assertInsideViewport(metrics.frame!, 'application frame');
    assertNoSelfOverflow(metrics.frame!, 'application frame');

    expect(metrics.player).not.toBeNull();
    assertInsideViewport(metrics.player!, 'preview player');
    assertNoSelfOverflow(metrics.player!, 'preview player');

    expect(metrics.playerControls).not.toBeNull();
    assertInsideViewport(metrics.playerControls!, 'player controls');
    assertNoSelfOverflow(metrics.playerControls!, 'player controls');

    expect(metrics.zones.map((zone) => zone.id).sort()).toEqual(
      ['bottom', 'center-bottom', 'center-top', 'left', 'right'].sort(),
    );
    for (const zone of metrics.zones) {
      expect(zone.rect, `${zone.id} dock zone has no rendered bounds`).not.toBeNull();
      assertInsideViewport(zone.rect!, `${zone.id} dock zone`);
      assertNoSelfOverflow(zone.rect!, `${zone.id} dock zone`);
    }
  });
}

test('should reserve viewport space when the application banner is visible', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await seedResponsiveEditor(page);

  const metrics = await page.evaluate(async () => {
    const frame = document.querySelector<HTMLElement>('[data-testid="app-frame"]');
    const banner = document.querySelector<HTMLElement>('[data-testid="app-frame-banner"]');
    const content = document.querySelector<HTMLElement>('[data-testid="app-frame-content"]');
    if (!frame || !banner || !content) {
      throw new Error('Application frame regions are unavailable.');
    }

    const visibleBanner = document.createElement('div');
    visibleBanner.textContent = 'Version 9.9.9 is available';
    visibleBanner.style.height = '48px';
    visibleBanner.style.padding = '8px 16px';
    visibleBanner.style.boxSizing = 'border-box';
    banner.appendChild(visibleBanner);

    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

    const frameRect = frame.getBoundingClientRect();
    const bannerRect = banner.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    return {
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      frame: { top: frameRect.top, bottom: frameRect.bottom, height: frameRect.height },
      banner: { top: bannerRect.top, bottom: bannerRect.bottom, height: bannerRect.height },
      content: { top: contentRect.top, bottom: contentRect.bottom, height: contentRect.height },
    };
  });

  expect(metrics.banner.height).toBe(48);
  expect(metrics.frame.top).toBeGreaterThanOrEqual(-1);
  expect(metrics.frame.bottom).toBeLessThanOrEqual(metrics.viewportHeight + 1);
  expect(metrics.banner.top).toBeCloseTo(metrics.frame.top, 0);
  expect(metrics.content.top).toBeCloseTo(metrics.banner.bottom, 0);
  expect(metrics.content.bottom).toBeCloseTo(metrics.frame.bottom, 0);
  expect(metrics.content.height + metrics.banner.height).toBeCloseTo(metrics.frame.height, 0);
  expect(metrics.documentHeight).toBeLessThanOrEqual(metrics.viewportHeight + 1);
});

test('should keep Add Text actions reachable when the window is at minimum size', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await seedResponsiveEditor(page);
  await page.evaluate(() => {
    const hooks = window.__OPENREELIO_E2E__;
    if (!hooks) throw new Error('OpenReelio E2E hooks are not available.');
    hooks.seekPlayback(5, 'responsive-modal-test');
  });

  const addTextButton = page.locator('[data-testid="add-text-button"]');
  await expect(addTextButton).toHaveCount(1);
  await expect(addTextButton).toBeVisible();
  await expect(addTextButton).toBeEnabled();
  await addTextButton.click();

  const dialog = page.locator('[data-testid="add-text-dialog"]');
  await expect(dialog).toBeVisible();
  const addButton = dialog.getByRole('button', { name: 'Add', exact: true });
  const body = dialog.locator('[data-modal-slot="body"]');
  const footer = dialog.locator('[data-modal-slot="footer"]');
  await expect(addButton).toBeVisible();
  await expect(footer).toBeVisible();

  await body.evaluate((element) => {
    const overflowProbe = document.createElement('div');
    overflowProbe.setAttribute('data-testid', 'modal-overflow-probe');
    overflowProbe.style.height = '1000px';
    overflowProbe.style.flexShrink = '0';
    element.appendChild(overflowProbe);
  });

  const bounds = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const body = element.querySelector<HTMLElement>('[data-modal-slot="body"]');
    const footer = element.querySelector<HTMLElement>('[data-modal-slot="footer"]');
    const footerRect = footer?.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      bodyClientHeight: body?.clientHeight ?? null,
      bodyScrollHeight: body?.scrollHeight ?? null,
      footerTop: footerRect?.top ?? null,
      footerBottom: footerRect?.bottom ?? null,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  });

  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewportWidth);
  expect(bounds.top).toBeGreaterThanOrEqual(0);
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.viewportHeight);
  expect(bounds.bodyClientHeight).not.toBeNull();
  expect(bounds.bodyScrollHeight).not.toBeNull();
  expect(bounds.footerTop).not.toBeNull();
  expect(bounds.footerBottom).not.toBeNull();
  expect(bounds.footerBottom ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(
    bounds.viewportHeight,
  );

  const bodyCanScroll = await body.evaluate((element) => {
    if (element.scrollHeight <= element.clientHeight) return false;
    element.scrollTop = element.scrollHeight;
    return element.scrollTop > 0;
  });
  expect(bounds.bodyScrollHeight).toBeGreaterThan(bounds.bodyClientHeight!);
  expect(bodyCanScroll).toBe(true);
  await expect(footer).toBeVisible();
  await expect(addButton).toBeVisible();

  await dialog.locator('#text-content').fill('Responsive footer verification');
  await expect(addButton).toBeEnabled();
  await addButton.focus();
  await expect(addButton).toBeFocused();
});

test('should hide developer diagnostics when the production settings UI opens', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await seedResponsiveEditor(page);

  await page.getByRole('button', { name: 'Open settings', exact: true }).click();
  await expect(page.locator('[data-testid="settings-dialog"]')).toBeVisible();

  await expect(page.getByRole('button', { name: 'Developer', exact: true })).toHaveCount(0);
  await expect(page.getByText('Agent Execution Traces', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'AI', exact: true }).click();
  await expect(page.getByText('CODEX_HOME:', { exact: false })).toHaveCount(0);
  await expect(page.getByText('Raw data', { exact: true })).toHaveCount(0);
});
