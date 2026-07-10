/**
 * FileTree Component Tests
 *
 * Tests for the workspace file tree component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileTree } from './FileTree';
import type { FileTreeEntry } from '@/types';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockEntry(
  overrides: Partial<FileTreeEntry> & { relativePath: string },
): FileTreeEntry {
  return {
    name: overrides.relativePath.split('/').pop() ?? overrides.relativePath,
    isDirectory: false,
    children: [],
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('FileTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Empty State Tests
  // ===========================================================================

  describe('empty state', () => {
    it('should show empty message when no entries and not scanning', () => {
      render(<FileTree entries={[]} />);

      expect(screen.getByText('No media files found')).toBeInTheDocument();
    });

    it('should show scan button in empty state', () => {
      const onScan = vi.fn();
      render(<FileTree entries={[]} onScan={onScan} />);

      const scanButton = screen.getByText('Scan workspace');
      expect(scanButton).toBeInTheDocument();
    });

    it('should call onScan when scan button is clicked', () => {
      const onScan = vi.fn();
      render(<FileTree entries={[]} onScan={onScan} />);

      fireEvent.click(screen.getByText('Scan workspace'));

      expect(onScan).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Scanning State Tests
  // ===========================================================================

  describe('scanning state', () => {
    it('should show scanning indicator when isScanning is true', () => {
      const entries = [createMockEntry({ relativePath: 'video.mp4' })];
      render(<FileTree entries={entries} isScanning={true} />);

      expect(screen.getByText('Scanning workspace...')).toBeInTheDocument();
    });

    it('should not show empty state when scanning with no entries', () => {
      render(<FileTree entries={[]} isScanning={true} />);

      // Empty state should not show when scanning
      expect(screen.queryByText('No media files found')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Normal State Tests
  // ===========================================================================

  describe('normal state', () => {
    it('should render file tree entries', () => {
      const entries = [
        createMockEntry({ relativePath: 'video1.mp4', name: 'video1.mp4' }),
        createMockEntry({ relativePath: 'audio1.mp3', name: 'audio1.mp3' }),
      ];

      render(<FileTree entries={entries} />);

      expect(screen.getByText('video1.mp4')).toBeInTheDocument();
      expect(screen.getByText('audio1.mp3')).toBeInTheDocument();
    });

    it('should render directory entries', () => {
      const entries = [
        createMockEntry({
          relativePath: 'footage',
          name: 'footage',
          isDirectory: true,
          children: [createMockEntry({ relativePath: 'footage/clip.mp4', name: 'clip.mp4' })],
        }),
      ];

      render(<FileTree entries={entries} />);

      expect(screen.getByText('footage')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Interaction Tests
  // ===========================================================================

  describe('interactions', () => {
    it('should not show empty state when entries are present', () => {
      const entries = [createMockEntry({ relativePath: 'video1.mp4' })];

      render(<FileTree entries={entries} />);

      expect(screen.queryByText('No media files found')).not.toBeInTheDocument();
    });

    it('should move focus between a folder and its child when arrow keys are pressed', () => {
      const entries = [
        createMockEntry({
          relativePath: 'footage',
          name: 'footage',
          isDirectory: true,
          children: [createMockEntry({ relativePath: 'footage/clip.mp4', name: 'clip.mp4' })],
        }),
      ];

      render(<FileTree entries={entries} />);

      expect(screen.getByRole('tree', { name: 'Workspace files' })).toBeInTheDocument();

      const folder = screen.getByRole('treeitem', { name: 'footage' });
      const child = screen.getByRole('treeitem', { name: 'clip.mp4' });
      expect(folder).toHaveAttribute('aria-expanded', 'true');
      expect(folder).toHaveAttribute('aria-level', '1');
      expect(child).toHaveAttribute('aria-level', '2');
      expect(screen.getByRole('button', { name: 'Collapse footage' })).toBeInTheDocument();

      folder.focus();
      fireEvent.keyDown(folder, { key: 'ArrowRight' });
      expect(child).toHaveFocus();

      fireEvent.keyDown(child, { key: 'ArrowLeft' });
      expect(folder).toHaveFocus();

      fireEvent.keyDown(folder, { key: 'ArrowLeft' });
      expect(folder).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('treeitem', { name: 'clip.mp4' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Expand footage' })).toBeInTheDocument();

      fireEvent.keyDown(folder, { key: 'ArrowRight' });
      expect(folder).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('treeitem', { name: 'clip.mp4' })).toBeInTheDocument();
    });

    it('should keep one tab stop when vertical and boundary keys are pressed', () => {
      const entries = [
        createMockEntry({
          relativePath: 'footage',
          name: 'footage',
          isDirectory: true,
          children: [createMockEntry({ relativePath: 'footage/clip.mp4', name: 'clip.mp4' })],
        }),
        createMockEntry({ relativePath: 'audio.mp3', name: 'audio.mp3' }),
        createMockEntry({ relativePath: 'image.png', name: 'image.png' }),
      ];

      render(<FileTree entries={entries} />);

      const folder = screen.getByRole('treeitem', { name: 'footage' });
      const child = screen.getByRole('treeitem', { name: 'clip.mp4' });
      const audio = screen.getByRole('treeitem', { name: 'audio.mp3' });
      const image = screen.getByRole('treeitem', { name: 'image.png' });

      expect(folder).toHaveAttribute('tabindex', '0');
      expect(child).toHaveAttribute('tabindex', '-1');
      expect(audio).toHaveAttribute('tabindex', '-1');
      expect(image).toHaveAttribute('tabindex', '-1');

      folder.focus();
      fireEvent.keyDown(folder, { key: 'ArrowDown' });
      expect(child).toHaveFocus();
      expect(child).toHaveAttribute('tabindex', '0');
      expect(folder).toHaveAttribute('tabindex', '-1');

      fireEvent.keyDown(child, { key: 'ArrowDown' });
      expect(audio).toHaveFocus();

      fireEvent.keyDown(audio, { key: 'ArrowUp' });
      expect(child).toHaveFocus();

      fireEvent.keyDown(child, { key: 'End' });
      expect(image).toHaveFocus();

      fireEvent.keyDown(image, { key: 'Home' });
      expect(folder).toHaveFocus();

      fireEvent.click(screen.getByRole('button', { name: 'Collapse footage' }));
      expect(folder).toHaveFocus();
      expect(folder).toHaveAttribute('tabindex', '0');
      expect(screen.queryByRole('treeitem', { name: 'clip.mp4' })).not.toBeInTheDocument();
    });

    it('should select without opening the file when Space or Enter is pressed', () => {
      const onFileClick = vi.fn();
      const onFileDoubleClick = vi.fn();
      const entries = [createMockEntry({ relativePath: 'video1.mp4', name: 'video1.mp4' })];

      render(
        <FileTree
          entries={entries}
          onFileClick={onFileClick}
          onFileDoubleClick={onFileDoubleClick}
        />,
      );

      const file = screen.getByRole('treeitem', { name: 'video1.mp4' });
      expect(file).toHaveAttribute('aria-selected', 'false');

      fireEvent.keyDown(file, { key: ' ' });
      expect(onFileClick).toHaveBeenCalledTimes(1);
      expect(file).toHaveAttribute('aria-selected', 'true');

      fireEvent.keyDown(file, { key: 'Enter' });
      expect(onFileClick).toHaveBeenCalledTimes(2);
      expect(onFileDoubleClick).not.toHaveBeenCalled();

      fireEvent.doubleClick(screen.getByTitle('video1.mp4'));
      expect(onFileDoubleClick).toHaveBeenCalledWith(
        expect.objectContaining({ relativePath: 'video1.mp4' }),
      );
    });
  });

  // ===========================================================================
  // Edge Case & Destructive Tests
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle entries with special characters in names', () => {
      const entries = [
        createMockEntry({ relativePath: 'video (1) [final].mp4', name: 'video (1) [final].mp4' }),
      ];

      render(<FileTree entries={entries} />);

      expect(screen.getByText('video (1) [final].mp4')).toBeInTheDocument();
    });

    it('should handle deeply nested directories', () => {
      const deep = createMockEntry({
        relativePath: 'a/b/c',
        name: 'c',
        isDirectory: true,
        children: [createMockEntry({ relativePath: 'a/b/c/clip.mp4', name: 'clip.mp4' })],
      });
      const mid = createMockEntry({
        relativePath: 'a/b',
        name: 'b',
        isDirectory: true,
        children: [deep],
      });
      const root = createMockEntry({
        relativePath: 'a',
        name: 'a',
        isDirectory: true,
        children: [mid],
      });

      render(<FileTree entries={[root]} />);

      expect(screen.getByText('a')).toBeInTheDocument();
    });

    it('should handle empty directory entries', () => {
      const entries = [
        createMockEntry({
          relativePath: 'empty-dir',
          name: 'empty-dir',
          isDirectory: true,
          children: [],
        }),
      ];

      render(<FileTree entries={entries} />);

      expect(screen.getByText('empty-dir')).toBeInTheDocument();
    });

    it('should handle registered file entries with assetId', () => {
      const entries = [
        createMockEntry({
          relativePath: 'registered.mp4',
          name: 'registered.mp4',
          assetId: 'asset-123',
        }),
      ];

      render(<FileTree entries={entries} />);

      expect(screen.getByText('registered.mp4')).toBeInTheDocument();
    });

    it('should handle large number of entries', () => {
      const entries = Array.from({ length: 100 }, (_, i) =>
        createMockEntry({ relativePath: `file${i}.mp4`, name: `file${i}.mp4` }),
      );

      render(<FileTree entries={entries} />);

      expect(screen.getByText('file0.mp4')).toBeInTheDocument();
      expect(screen.getByText('file99.mp4')).toBeInTheDocument();
    });

    it('should show scanning state even with existing entries', () => {
      const entries = [createMockEntry({ relativePath: 'video.mp4' })];
      render(<FileTree entries={entries} isScanning={true} />);

      expect(screen.getByText('Scanning workspace...')).toBeInTheDocument();
      expect(screen.getByText('video.mp4')).toBeInTheDocument();
    });
  });
});
