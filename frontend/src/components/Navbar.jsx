import { useInterwovenKit } from '@initia/interwovenkit-react'
import { Link, useLocation } from 'react-router-dom'
import UsernameDisplay from './UsernameDisplay'

export default function Navbar() {
  const { initiaAddress, openConnect, openWallet } = useInterwovenKit()
  const location = useLocation()

  const isActive = (path) => location.pathname === path ? 'active' : ''

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <span>Mint</span>Board
        </Link>

        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>Discover</Link>
          <Link to="/publish" className={isActive('/publish')}>Publish</Link>
          <Link to="/creator" className={isActive('/creator')}>Earnings</Link>
          <Link to="/reader" className={isActive('/reader')}>Wallet</Link>
        </div>

        <div className="navbar-right">
          {initiaAddress ? (
            <button className="btn btn-secondary btn-sm" onClick={openWallet}>
              <UsernameDisplay />
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={openConnect}>
              Connect
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
