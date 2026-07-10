import { convertFileSrc } from '@tauri-apps/api/core';

import type { ClipAnalysisData } from './ClipAnalysisResultCard';

interface ProductionFinding {
  label?: string | null;
  description?: string | null;
  imagePath?: string | null;
  timelineSec?: number | null;
  timelineEndSec?: number | null;
  confidence?: number | null;
}

function formatTime(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const safeValue = Math.max(0, value);
  const hours = Math.floor(safeValue / 3600);
  const minutes = Math.floor((safeValue % 3600) / 60);
  const seconds = safeValue % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${seconds.toFixed(1).padStart(4, '0')}`;
  }
  return minutes > 0
    ? `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`
    : `${seconds.toFixed(1)}s`;
}

function getSafeLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const filename = value.trim().split(/[\\/]/).pop()?.trim();
  if (
    !filename ||
    /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(filename) ||
    /^(?:clip|asset)[-_][a-z0-9_-]{8,}$/i.test(filename)
  ) {
    return null;
  }
  return filename.length > 80 ? `${filename.slice(0, 77).trimEnd()}...` : filename;
}

function getFindings(root: ClipAnalysisData): ProductionFinding[] {
  if (root.ranges?.length) {
    return root.ranges.slice(0, 4).map((range) => ({
      description: range.evidence?.[0]?.description,
      timelineSec: range.timelineStartSec,
      timelineEndSec: range.timelineEndSec,
      confidence: range.confidence ?? range.evidence?.[0]?.confidence,
    }));
  }
  if (root.hits?.length) {
    return root.hits.slice(0, 4).map((hit) => ({
      description: hit.description,
      imagePath: hit.imagePath,
      timelineSec: hit.timelineSec,
      confidence: hit.confidence,
    }));
  }

  const clips = root.clips?.length ? root.clips : [root];
  return clips
    .slice(0, 3)
    .flatMap<ProductionFinding>((clip, index) => {
      const label = getSafeLabel(clip.assetName) ?? (clips.length > 1 ? `Clip ${index + 1}` : null);
      if (clip.observations?.length) {
        return clip.observations.slice(0, 4).map((observation) => ({
          label,
          description: observation.description,
          imagePath: observation.imagePath,
          timelineSec: observation.timelineSec,
          confidence: observation.confidence,
        }));
      }
      if (clip.samples?.length) {
        return clip.samples.slice(0, 4).map((sample) => ({
          label,
          description: clip.summary,
          imagePath: sample.imagePath,
          timelineSec: sample.timelineSec,
        }));
      }
      return clip.summary ? [{ label, description: clip.summary }] : [];
    })
    .slice(0, 4);
}

function resolveImageSrc(path: string): string {
  try {
    return convertFileSrc(path);
  } catch {
    return path;
  }
}

export function ProductionClipAnalysisView({ root }: { root: ClipAnalysisData }) {
  const clips = root.clips?.length ? root.clips : [root];
  const label = getSafeLabel(clips[0]?.assetName);
  const findings = getFindings(root);
  const summary = root.summary ?? clips[0]?.summary ?? null;
  const qualityScore = clips[0]?.quality?.score;

  return (
    <section
      className="mt-2 min-w-0 max-w-full space-y-3 overflow-hidden rounded-lg border border-border-subtle bg-surface-elevated/70 p-3"
      data-testid="clip-analysis-summary"
      aria-label="Clip analysis"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-text-tertiary">
          Clip analysis
        </span>
        {label && (
          <span className="min-w-0 max-w-full truncate text-sm font-medium text-text-primary">
            {label}
          </span>
        )}
        {typeof qualityScore === 'number' && Number.isFinite(qualityScore) && (
          <span className="rounded-full border border-border-subtle bg-surface-base px-2 py-0.5 text-[11px] text-text-secondary">
            Confidence {Math.round(qualityScore)}%
          </span>
        )}
      </div>

      {summary && (
        <p className="max-w-full break-words text-xs leading-relaxed text-text-secondary [overflow-wrap:anywhere]">
          {summary}
        </p>
      )}

      {findings.length > 0 ? (
        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
          {findings.map((finding, index) => {
            const startTime = formatTime(finding.timelineSec);
            const endTime = formatTime(finding.timelineEndSec);
            const confidence =
              typeof finding.confidence === 'number' && Number.isFinite(finding.confidence)
                ? `${Math.round(finding.confidence * 100)}%`
                : null;
            return (
              <figure
                key={`${finding.imagePath ?? finding.timelineSec ?? 'finding'}-${index}`}
                className="min-w-0 overflow-hidden rounded-md border border-border-subtle bg-surface-base"
              >
                {finding.imagePath && (
                  <img
                    src={resolveImageSrc(finding.imagePath)}
                    alt={finding.label ? `${finding.label} preview` : 'Clip preview'}
                    className="aspect-video w-full object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                )}
                <figcaption className="min-w-0 space-y-1 px-2 py-1.5">
                  {finding.label && finding.label !== label && (
                    <p className="truncate text-xs font-medium text-text-primary">
                      {finding.label}
                    </p>
                  )}
                  {finding.description && finding.description !== summary && (
                    <p className="line-clamp-3 break-words text-xs leading-snug text-text-primary [overflow-wrap:anywhere]">
                      {finding.description}
                    </p>
                  )}
                  {(startTime || confidence) && (
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-text-secondary">
                      {startTime && (
                        <span>{endTime ? `${startTime}–${endTime}` : `At ${startTime}`}</span>
                      )}
                      {confidence && <span>Confidence {confidence}</span>}
                    </div>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>
      ) : (
        !summary && <p className="text-xs text-text-secondary">Analysis complete.</p>
      )}
    </section>
  );
}
