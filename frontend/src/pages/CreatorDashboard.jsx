import { useState, useEffect, useCallback } from 'react'
import { useInterwovenKit } from '@initia/interwovenkit-react'
import {
  getCreatorEarnings, getAuthorArticles, getArticle, formatMIN, encodeWithdraw, encodeDeactivate,
  getFeaturedArticles, getCuratorStake, getPendingCuratorRewards, getBoostAmount,
  encodeWithdrawBoost, encodeClaimCuratorRewards,
} from '../lib/evm'
import { CONTRACTS, ROLLUP_CHAIN_ID } from '../config/chains'
import UsernameDisplay from '../components/UsernameDisplay'

export default function CreatorDashboard() {
  const { initiaAddress, autoSign, requestTxBlock, submitTxBlock, estimateGas } = useInterwovenKit()
  const isAutoSignEnabled = autoSign?.isEnabledByChain?.[ROLLUP_CHAIN_ID]
  const [earnings, setEarnings] = useState(0n)
  const [articles, setArticles] = useState([])
  const [boosts, setBoosts] = useState([]) // [{articleId, stake, pending, totalBoost}]
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [actionLoading, setActionLoading] = useState(null) // articleId being acted on

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

  const loadData = useCallback(async () => {
    if (!initiaAddress) return
    try {
      const { AccAddress } = await import('@initia/initia.js')
      const hexAddr = AccAddress.toHex(initiaAddress)

      const [earn, articleIds] = await Promise.all([
        getCreatorEarnings(hexAddr),
        getAuthorArticles(hexAddr),
      ])
      setEarnings(earn)

      const details = await Promise.all(
        articleIds.map(async (id) => getArticle(Number(id)))
      )
      setArticles(details.filter(Boolean))

      // Load curator boost data
      const featured = await getFeaturedArticles()
      const boostData = []
      for (const artId of featured) {
        const id = Number(artId)
        const [stake, pending, totalBoost] = await Promise.all([
          getCuratorStake(hexAddr, id),
          getPendingCuratorRewards(hexAddr, id),
          getBoostAmount(id),
        ])
        if (stake > 0n || pending > 0n) {
          let title = `Article #${id}`
          try {
            const art = await getArticle(id)
            if (art?.metadataJSON) {
              const parsed = JSON.parse(art.metadataJSON)
              if (parsed.title) title = parsed.title
            }
          } catch {}
          // Fallback: try AI service
          if (title === `Article #${id}`) {
            try {
              const { getArticleContent } = await import('../lib/ai')
              const content = await getArticleContent(id)
              if (content?.title) title = content.title
            } catch {}
          }
          boostData.push({ articleId: id, title, stake, pending, totalBoost })
        }
      }
      setBoosts(boostData)
    } catch (e) {
      console.error('Failed to load creator data:', e)
    }
    setLoading(false)
  }, [initiaAddress])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleWithdraw() {
    if (!initiaAddress) return
    setWithdrawing(true)
    try {
      await sendTx([{
        typeUrl: '/minievm.evm.v1.MsgCall',
        value: {
          sender: initiaAddress.toLowerCase(),
          contractAddr: CONTRACTS.microPayment,
          input: encodeWithdraw(),
          value: '0', accessList: [], authList: [],
        },
      }])
      setEarnings(0n)
    } catch (e) {
      console.error('Withdraw failed:', e)
    }
    setWithdrawing(false)
  }

  async function handleWithdrawBoost(articleId) {
    setActionLoading(articleId)
    try {
      await sendTx([{
        typeUrl: '/minievm.evm.v1.MsgCall',
        value: {
          sender: initiaAddress.toLowerCase(),
          contractAddr: CONTRACTS.curationAgent,
          input: encodeWithdrawBoost(articleId),
          value: '0', accessList: [], authList: [],
        },
      }])
      await loadData()
    } catch (e) {
      console.error('Withdraw boost failed:', e)
    }
    setActionLoading(null)
  }

  async function handleClaimRewards(articleId) {
    setActionLoading(articleId + 10000) // offset to differentiate
    try {
      await sendTx([{
        typeUrl: '/minievm.evm.v1.MsgCall',
        value: {
          sender: initiaAddress.toLowerCase(),
          contractAddr: CONTRACTS.microPayment,
          input: encodeClaimCuratorRewards(articleId),
          value: '0', accessList: [], authList: [],
        },
      }])
      await loadData()
    } catch (e) {
      console.error('Claim rewards failed:', e)
    }
    setActionLoading(null)
  }

  if (!initiaAddress) {
    return (
      <div className="page">
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <h2>Connect your wallet to view earnings</h2>
        </div>
      </div>
    )
  }

  const totalReads = articles.reduce((sum, a) => sum + Number(a?.totalReads || 0), 0)

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Earnings Dashboard</h1>
        <p style={{ color: 'var(--fg-muted)', marginBottom: '2rem' }}>
          Welcome back, <UsernameDisplay />
        </p>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Creator Earnings</div>
            <div className="stat-value accent">{formatMIN(earnings)} MIN</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Articles Published</div>
            <div className="stat-value">{articles.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Reads</div>
            <div className="stat-value">{totalReads}</div>
          </div>
        </div>

        {earnings > 0n && (
          <button
            className="btn btn-primary btn-lg"
            onClick={handleWithdraw}
            disabled={withdrawing}
            style={{ marginBottom: '2rem' }}
          >
            {withdrawing ? 'Withdrawing...' : `Withdraw ${formatMIN(earnings)} MIN`}
          </button>
        )}

        {/* Your Articles */}
        <div className="section-header">
          <h2 className="section-title">Your Articles</h2>
        </div>

        {loading ? (
          <div className="card"><div className="skeleton skeleton-text" /></div>
        ) : articles.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--fg-muted)' }}>No articles published yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
            {articles.map((article, i) => {
              let title = `Article #${Number(article.id)}`
              try { title = JSON.parse(article.metadataJSON).title || title } catch {}
              const reads = Number(article.totalReads)
              const pricePerRead = article.pricePerRead
              // Estimate: 97.5% of (reads * pricePerRead) if no boost, 87.5% if boosted
              const grossRevenue = BigInt(reads) * pricePerRead
              const estimatedEarnings = (grossRevenue * 975n) / 1000n
              return (
                <div key={i} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{title}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)' }}>
                        {reads} reads · {formatMIN(pricePerRead)} MIN/read · ~{formatMIN(estimatedEarnings)} MIN earned
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                      <span className={`badge ${article.isActive ? 'badge-verified' : 'badge-tampered'}`}>
                        {article.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {article.isActive && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          onClick={async (e) => {
                            e.preventDefault()
                            try {
                              await sendTx([{
                                typeUrl: '/minievm.evm.v1.MsgCall',
                                value: {
                                  sender: initiaAddress.toLowerCase(),
                                  contractAddr: CONTRACTS.contentRegistry,
                                  input: encodeDeactivate(Number(article.id)),
                                  value: '0', accessList: [], authList: [],
                                },
                              }])
                              await loadData()
                            } catch (err) {
                              console.error('Deactivate failed:', err)
                            }
                          }}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Curator Boosts */}
        <div className="section-header">
          <h2 className="section-title">Your Boosts</h2>
        </div>

        {loading ? (
          <div className="card"><div className="skeleton skeleton-text" /></div>
        ) : boosts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--fg-muted)' }}>You haven't boosted any articles yet. Boost articles to earn 10% of their read revenue.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {boosts.map((b) => (
              <div key={b.articleId} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{b.title}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)', marginTop: '0.25rem' }}>
                      Your stake: {formatMIN(b.stake)} MIN · Total boost: {formatMIN(b.totalBoost)} MIN
                    </div>
                    {b.pending > 0n && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--accent)', marginTop: '0.25rem', fontWeight: 600 }}>
                        Pending rewards: {formatMIN(b.pending)} MIN
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    {b.pending > 0n && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleClaimRewards(b.articleId)}
                        disabled={actionLoading === b.articleId + 10000}
                      >
                        {actionLoading === b.articleId + 10000 ? 'Claiming...' : 'Claim'}
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleWithdrawBoost(b.articleId)}
                      disabled={actionLoading === b.articleId}
                    >
                      {actionLoading === b.articleId ? 'Unstaking...' : 'Unstake'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
