export default function VerifiedBadge({ isVerified }) {
  if (isVerified === null || isVerified === undefined) return null

  return isVerified ? (
    <span className="badge badge-verified">✓ Verified</span>
  ) : (
    <span className="badge badge-tampered">✗ Tampered</span>
  )
}
