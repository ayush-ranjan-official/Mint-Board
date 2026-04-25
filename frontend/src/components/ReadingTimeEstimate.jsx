export default function ReadingTimeEstimate({ minutes }) {
  if (!minutes) return null
  return <span>{minutes} min read</span>
}
