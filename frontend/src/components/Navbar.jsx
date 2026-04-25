import { useState } from 'react'
import { useInterwovenKit } from '@initia/interwovenkit-react'
import { Link, useLocation } from 'react-router-dom'
import UsernameDisplay from './UsernameDisplay'
import logo from '../logo.png'

export default function Navbar() {
  const { initiaAddress, openConnect, openWallet } = useInterwovenKit()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path) => location.pathname === path ? 'active' : ''
  const navLinks = [
    { path: '/', label: 'Discover' },
    { path: '/publish', label: 'Publish' },
    { path: '/creator', label: 'Earnings' },
    { path: '/reader', label: 'Wallet' },
    { path: '/about', label: 'About' },
  ]

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="MintBoard" className="navbar-logo" />
        </Link>

        <div className="navbar-links">
          {navLinks.map(({ path, label }) => (
            <Link key={path} to={path} className={isActive(path)}>{label}</Link>
          ))}
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

          <button
            className="navbar-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              ) : (
                <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              )}
            </svg>
          </button>
        </div>
      </div>

      <div className={`navbar-mobile ${mobileOpen ? 'open' : ''}`}>
        {navLinks.map(({ path, label }) => (
          <Link key={path} to={path} className={isActive(path)} onClick={() => setMobileOpen(false)}>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
