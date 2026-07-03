/**
 * useInterchangeExport Hook Tests
 *
 * Verifies dialog handling, filename sanitization, and export status updates.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { invoke } from '@tauri-apps/api/core';
import { useInterchangeExport } from './useInterchangeExport';

describe('useInterchangeExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sanitize the default filename before opening the save dialog', async () => {
    vi.mocked(invoke).mockResolvedValue(null);

    const { result } = renderHook(() => useInterchangeExport());

    await act(async () => {
      await result.current.exportEdl('sequence-1', 'My:Sequence');
    });

    expect(invoke).toHaveBeenCalledWith('pick_export_destination', {
      defaultName: 'My_Sequence.edl',
      filters: [{ name: 'Edit Decision List', extensions: ['edl'] }],
    });
    expect(result.current.status).toEqual({ type: 'idle' });
  });

  it('should update status to completed when the export succeeds', async () => {
    const exportResult = {
      outputPath: '/tmp/sequence.edl',
      format: 'edl',
      eventCount: 3,
      trackCount: 2,
      durationSec: 12.5,
    };
    vi.mocked(invoke).mockImplementation(async (command) => {
      if (command === 'pick_export_destination') {
        return '/tmp/sequence.edl';
      }
      // export_edl backs commands.exportEdl via the Result wrapper
      return exportResult;
    });

    const { result } = renderHook(() => useInterchangeExport());

    await act(async () => {
      await result.current.exportEdl('sequence-1', 'Sequence');
    });

    // Verify the typed command was called (invoke is the underlying transport)
    expect(invoke).toHaveBeenCalledWith('export_edl', {
      sequenceId: 'sequence-1',
      outputPath: '/tmp/sequence.edl',
    });
    expect(result.current.status).toEqual({
      type: 'completed',
      result: exportResult,
    });
  });

  it('should update status to failed when the backend returns an error', async () => {
    vi.mocked(invoke).mockImplementation(async (command) => {
      if (command === 'pick_export_destination') {
        return '/tmp/sequence.edl';
      }
      // Simulate a backend error — invoke throws, bindings catch and wrap as { status: "error" }
      throw 'Sequence not found: seq-1';
    });

    const { result } = renderHook(() => useInterchangeExport());

    await act(async () => {
      await result.current.exportEdl('seq-1', 'Sequence');
    });

    expect(result.current.status).toEqual({
      type: 'failed',
      error: 'Sequence not found: seq-1',
    });
  });

  it('should update status to failed when the save dialog throws', async () => {
    vi.mocked(invoke).mockImplementation(async (command) => {
      if (command === 'pick_export_destination') {
        throw new Error('Dialog unavailable');
      }
      return undefined;
    });

    const { result } = renderHook(() => useInterchangeExport());

    await act(async () => {
      await result.current.exportFcpxml('sequence-1', 'Sequence');
    });

    expect(invoke).not.toHaveBeenCalledWith('export_fcpxml', expect.anything());
    expect(result.current.status).toEqual({
      type: 'failed',
      error: 'Dialog unavailable',
    });
  });
});
