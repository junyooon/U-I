const MAX_DISTANCE = 100
const HALF_LIFE_DAYS = 60

export function computeDistance(daysSinceContact: number | null): number {
  if (daysSinceContact === 0) return 5
  if (daysSinceContact === null) return 85

  const t = daysSinceContact / HALF_LIFE_DAYS
  const raw = MAX_DISTANCE * (1 - Math.exp(-0.693 * t))
  return Math.min(raw, MAX_DISTANCE - 5)
}
