import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClipAnalysisResultCard } from './ClipAnalysisResultCard';

describe('ClipAnalysisResultCard', () => {
  it('should keep a useful summary when diagnostics are disabled', () => {
    render(
      <ClipAnalysisResultCard
        tool="analyze_timeline_clip"
        diagnosticsEnabled={false}
        data={{
          clipId: 'private-clip-id',
          assetId: 'private-asset-id',
          assetName: '/private/source/Interview.mp4',
          action: 'private-action',
          query: 'private-query',
          summary: 'A speaker introduces the main topic.',
          quality: { status: 'private-status', score: 82 },
          observations: [
            {
              sampleId: 'private-sample-id',
              timelineSec: 12.5,
              sourceSec: 99.25,
              imagePath: 'C:/previews/interview.jpg',
              description: 'The speaker looks toward the camera.',
              confidence: 0.91,
              evidenceSource: 'private-evidence-source',
              provider: { provider: 'private-provider', model: 'private-model' },
              actions: ['private-action-label'],
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId('clip-analysis-summary')).toBeInTheDocument();
    expect(screen.getByText('Interview.mp4')).toBeInTheDocument();
    expect(screen.getByText('A speaker introduces the main topic.')).toBeInTheDocument();
    expect(screen.getByText('The speaker looks toward the camera.')).toBeInTheDocument();
    expect(screen.getByText('At 12.5s')).toBeInTheDocument();
    expect(screen.getByText('Confidence 91%')).toBeInTheDocument();
    expect(screen.queryByText('Clip Evidence')).not.toBeInTheDocument();
    expect(screen.queryByText(/private-clip-id/)).not.toBeInTheDocument();
    expect(screen.queryByText(/private-sample-id/)).not.toBeInTheDocument();
    expect(screen.queryByText(/private-provider/)).not.toBeInTheDocument();
    expect(screen.queryByText(/private-evidence-source/)).not.toBeInTheDocument();
    expect(screen.queryByText(/private-action/)).not.toBeInTheDocument();
    expect(screen.queryByText(/private-query/)).not.toBeInTheDocument();
    expect(screen.queryByText(/private-status/)).not.toBeInTheDocument();
    expect(screen.queryByText(/99\.25/)).not.toBeInTheDocument();

    const preview = screen.getByRole('img', { name: 'Interview.mp4 preview' });
    fireEvent.error(preview);
    expect(preview).toHaveAttribute('hidden');
  });

  it('should cap findings when multiple hour-long clips are summarized', () => {
    render(
      <ClipAnalysisResultCard
        tool="analyze_timeline_clip"
        diagnosticsEnabled={false}
        data={{
          clips: [
            {
              assetName: 'First.mp4',
              observations: [
                { timelineSec: 3661.2, description: 'First finding' },
                { timelineSec: 2, description: 'Second finding' },
                { timelineSec: 3, description: 'Third finding' },
              ],
            },
            {
              assetName: 'Second.mp4',
              observations: [
                { timelineSec: 4, description: 'Fourth finding' },
                { timelineSec: 5, description: 'Fifth finding' },
                { timelineSec: 6, description: 'Sixth finding' },
              ],
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('At 1:01:01.2')).toBeInTheDocument();
    expect(screen.getByText('First finding')).toBeInTheDocument();
    expect(screen.getByText('Second finding')).toBeInTheDocument();
    expect(screen.getByText('Third finding')).toBeInTheDocument();
    expect(screen.getByText('Fourth finding')).toBeInTheDocument();
    expect(screen.queryByText('Fifth finding')).not.toBeInTheDocument();
    expect(screen.queryByText('Sixth finding')).not.toBeInTheDocument();
  });
});
