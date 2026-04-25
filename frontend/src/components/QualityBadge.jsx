export default function QualityBadge({ score }) {
  if (!score && score !== 0) return null

  // Score is 0-100 from contract, display as x.x/10
  const displayScore = (score / 10).toFixed(1)

  let className = 'badge '
  if (score >= 80) className += 'badge-quality-high'
  else if (score >= 50) className += 'badge-quality-mid'
  else className += 'badge-quality-low'

  return (
    <span className={className}>
      ★ {displayScore}
    </span>
  )
}
