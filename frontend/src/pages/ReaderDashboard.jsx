import { useState, useEffect, useCallback } from 'react'
import { useInterwovenKit } from '@initia/interwovenkit-react'
import { getReaderBalance, formatMIN, parseMIN, encodeDeposit, encodeApprove, encodeWithdrawReaderBalance, getNextArticleId, hasAccess, getArticle } from '../lib/evm'
import { getArticleContent } from '../lib/ai'
import { Link } from 'react-router-dom'
import { CONTRACTS, ROLLUP_CHAIN_ID, UMIN_ERC20 } from '../config/chains'
import UsernameDisplay from '../components/UsernameDisplay'
import BridgeButton from '../components/BridgeButton'
import AutoSignBanner from '../components/AutoSignBanner'

export default function ReaderDashboard() {
  const { initiaAddress, autoSign, requestTxBlock, submitTxBlock, estimateGas } = useInterwovenKit()
  const [balance, setBalance] = useState(0n)
  const [depositAmount, setDepositAmount] = useState('1')
  const [depositing, setDepositing] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [readArticles, setReadArticles] = useState([]) // [{id, title}]

  const isAutoSignEnabled = autoSign?.isEnabledByChain?.[ROLLUP_CHAIN_ID]

  const loadBalance = useCallback(async () => {
    if (!initiaAddress) return
    try {
      const { AccAddress } = await import('@initia/initia.js')
      const hexAddr = AccAddress.toHex(initiaAddress)
      const bal = await getReaderBalance(hexAddr)
      setBalance(bal)

      // Load reading history
      const totalArticles = await getNextArticleId()
      const history = []
      for (let i = 0; i < Number(totalArticles) && i < 50; i++) {
        const read = await hasAccess(hexAddr, i)
        if (read) {
          let title = `Article #${i}`
          try {
            const content = await getArticleContent(i)
            if (content?.title) title = content.title
          } catch {}
          history.push({ id: i, title })
        }
      }
      setReadArticles(history)
    } catch (e) {
      console.error('Failed to load balance:', e)
    }
    setLoading(false)
  }, [initiaAddress])

  useEffect(() => {
    loadBalance()
  }, [loadBalance])

  async function sendTx(messages) {
    if (isAutoSignEnabled && submitTxBlock) {
      const gasEstimate = await estimateGas({ messages })
      const { calculateFee, GasPrice } = await import('@cosmjs/stargate')
      const fee = calculateFee(Math.ceil(gasEstimate * 1.5), GasPrice.fromString('0umin'))
      await submitTxBlock({ messages, fee })
    } else {
      await requestTxBlock({ chainId: ROLLUP_CHAIN_ID, messages })
    }
  }

  async function handleDeposit() {
    if (!initiaAddress || !depositAmount) return
    setDepositing(true)
    try {
      const value = parseMIN(depositAmount)
      // Step 1: Approve MicroPayment contract to spend umin ERC20 tokens
      await sendTx([{
        typeUrl: '/minievm.evm.v1.MsgCall',
        value: {
          sender: initiaAddress.toLowerCase(),
          contractAddr: UMIN_ERC20,
          input: encodeApprove(CONTRACTS.microPayment, value),
          value: '0',
          accessList: [],
          authList: [],
        },
      }])
      // Step 2: Deposit into MicroPayment (it calls transferFrom)
      await sendTx([{
        typeUrl: '/minievm.evm.v1.MsgCall',
        value: {
          sender: initiaAddress.toLowerCase(),
          contractAddr: CONTRACTS.microPayment,
          input: encodeDeposit(value),
          value: '0',
          accessList: [],
          authList: [],
        },
      }])
      await loadBalance()
    } catch (e) {
      console.error('Deposit failed:', e)
    }
    setDepositing(false)
  }

  async function handleWithdraw() {
    if (!initiaAddress) return
    setWithdrawing(true)
    try {
      await sendTx([{
        typeUrl: '/minievm.evm.v1.MsgCall',
        value: {
          sender: initiaAddress.toLowerCase(),
          contractAddr: CONTRACTS.microPayment,
          input: encodeWithdrawReaderBalance(),
          value: '0',
          accessList: [],
          authList: [],
        },
      }])
      setBalance(0n)
    } catch (e) {
      console.error('Withdraw failed:', e)
    }
    setWithdrawing(false)
  }

  async function handleEnableAutoSign() {
    try {
      await autoSign?.enable(ROLLUP_CHAIN_ID, {
        permissions: ['/minievm.evm.v1.MsgCall', '/cosmos.bank.v1beta1.MsgSend'],
      })
    } catch (e) {
      console.error('Auto-sign enable failed:', e)
    }
  }

  async function handleDisableAutoSign() {
    try {
      await autoSign?.disable(ROLLUP_CHAIN_ID)
    } catch (e) {
      console.error('Auto-sign disable failed:', e)
    }
  }

  if (!initiaAddress) {
    return (
      <div className="page">
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <h2>Connect your wallet to manage your reading credits</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Reading Wallet</h1>
        <p style={{ color: 'var(--fg-muted)', marginBottom: '2rem' }}>
          Manage your reading credits, <UsernameDisplay />
        </p>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Reading Credits</div>
            <div className="stat-value accent">{loading ? '...' : `${formatMIN(balance)} MIN`}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Auto-Pay Status</div>
            <div className="stat-value" style={{ color: isAutoSignEnabled ? 'var(--success)' : 'var(--fg-muted)' }}>
              {isAutoSignEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>

        {/* Auto-Sign Controls */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Seamless Reading</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--fg-muted)', marginBottom: '1rem' }}>
            When auto-pay is enabled, articles unlock instantly without wallet popups. You approve once, then read freely.
          </p>
          {isAutoSignEnabled ? (
            <button className="btn btn-secondary" onClick={handleDisableAutoSign}>
              Disable Auto-Pay
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleEnableAutoSign}>
              Enable Auto-Pay
            </button>
          )}
        </div>

        {/* Top Up */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Top Up Reading Credits</h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Amount (MIN)</label>
              <input
                className="form-input"
                type="number"
                step="0.1"
                min="0"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={handleDeposit} disabled={depositing}>
              {depositing ? 'Processing...' : 'Top Up'}
            </button>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <BridgeButton />
            <span style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)', marginLeft: '0.75rem' }}>
              Need tokens? Bridge INIT from L1
            </span>
          </div>
        </div>

        {/* Withdraw */}
        {balance > 0n && (
          <button
            className="btn btn-secondary"
            onClick={handleWithdraw}
            disabled={withdrawing}
            style={{ marginBottom: '2rem' }}
          >
            {withdrawing ? 'Withdrawing...' : `Withdraw ${formatMIN(balance)} MIN`}
          </button>
        )}

        {/* Reading History */}
        <div className="section-header" style={{ marginTop: '1.5rem' }}>
          <h2 className="section-title">Reading History</h2>
        </div>

        {loading ? (
          <div className="card"><div className="skeleton skeleton-text" /></div>
        ) : readArticles.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--fg-muted)' }}>No articles read yet. Start exploring!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {readArticles.map((a) => (
              <Link key={a.id} to={`/article/${a.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ fontWeight: 500 }}>{a.title}</span>
                  <span className="badge badge-verified">Read</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
