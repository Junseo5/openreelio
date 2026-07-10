export function getClampedTooltipPosition(
  position: number,
  containerWidth: number,
  tooltipWidth: number,
): number {
  const safePosition = Math.max(0, position);
  if (containerWidth <= 0 || tooltipWidth <= 0) {
    return safePosition;
  }

  const renderedTooltipWidth = Math.min(containerWidth, tooltipWidth);
  const halfTooltipWidth = renderedTooltipWidth / 2;
  const maximumPosition = Math.max(halfTooltipWidth, containerWidth - halfTooltipWidth);

  return Math.min(Math.max(safePosition, halfTooltipWidth), maximumPosition);
}
