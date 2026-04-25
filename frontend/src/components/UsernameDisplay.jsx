import { useInterwovenKit } from '@initia/interwovenkit-react'

export default function UsernameDisplay({ address }) {
  const { initiaAddress, username } = useInterwovenKit()
  const displayAddress = address || initiaAddress

  if (username) return <span className="username">{username}</span>

  if (!displayAddress) return <span className="username">Not connected</span>

  // Shorten address: init1abc...xyz
  const short = displayAddress.slice(0, 10) + '...' + displayAddress.slice(-4)
  return <span className="username">{short}</span>
}
