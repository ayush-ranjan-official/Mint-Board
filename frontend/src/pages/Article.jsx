import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useInterwovenKit } from '@initia/interwovenkit-react'
import { formatUnits } from 'viem'
import { getArticleContent } from '../lib/ai'
import { hasAccess, getQualityScore, getArticle, verifyContent, encodePayForRead, computeContentHash, formatMIN } from '../lib/evm'
import { CONTRACTS, ROLLUP_CHAIN_ID } from '../config/chains'
import QualityBadge from '../components/QualityBadge'
import VerifiedBadge from '../components/VerifiedBadge'
import ReadingTimeEstimate from '../components/ReadingTimeEstimate'
import BoostButton from '../components/BoostButton'
import AutoSignBanner from '../components/AutoSignBanner'

export default function ArticlePage() {
  const { id } = useParams()
  const { initiaAddress, autoSign, requestTxBlock, submitTxBlock, estimateGas } = useInterwovenKit()

  const [article, setArticle] = useState(null)
  const [onChainArticle, setOnChainArticle] = useState(null)
  const [access, setAccess] = useState(false)
  const [paying, setPaying] = useState(false)
  const [score, setScore] = useState(null)
  const [verified, setVerified] = useState(null)
  const [loading, setLoading] = useState(true)

  const articleId = Number(id)

  const loadArticle = useCallback(async () => {
    try {
      // First fetch on-chain data to get the contentCID (AI service article ID)
      const chainData = await getArticle(articleId)
      if (chainData && chainData.author !== '0x0000000000000000000000000000000000000000') {
        setOnChainArticle(chainData)
      }

      // Use contentCID from on-chain data to fetch from AI service, fallback to articleId
      const aiId = chainData?.contentCID ? Number(chainData.contentCID) || articleId : articleId
      const data = await getArticleContent(aiId)

      if (data) {
        setArticle(data)
        // Verify content hash against on-chain hash
        if (data.content && chainData && chainData.contentHash &&
            chainData.contentHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          try {
            const hash = computeContentHash(data.content)
            const isValid = await verifyContent(articleId, hash)
            setVerified(isValid)
          } catch {}
        }
      }
    } catch (e) {
      console.error('Failed to load article:', e)
    }
    setLoading(false)
  }, [articleId])

  const checkAccess = useCallback(async () => {
    if (!initiaAddress) return
    try {
      // Convert bech32 to hex for EVM call
      const { AccAddress } = await import('@initia/initia.js')
      const hexAddr = AccAddress.toHex(initiaAddress)
      const result = await hasAccess(hexAddr, articleId)
      setAccess(result)
    } catch (e) {
      // If contract not deployed, default to showing content for demo
      setAccess(true)
    }
  }, [initiaAddress, articleId])

  const loadScore = useCallback(async () => {
    try {
      const s = await getQualityScore(articleId)
      if (s && Number(s.timestamp) > 0) {
        setScore(Number(s.score))
      }
    } catch (e) {}
  }, [articleId])

  useEffect(() => {
    loadArticle()
    loadScore()
  }, [loadArticle, loadScore])

  useEffect(() => {
    checkAccess()
  }, [checkAccess])

  // Auto-pay when article loads if auto-sign is enabled and no access yet
  useEffect(() => {
    const isActive = onChainArticle?.isActive !== false
    const isFree = onChainArticle && onChainArticle.pricePerRead === 0n
    if (!access && initiaAddress && article && isActive && !isFree && autoSign?.isEnabledByChain?.[ROLLUP_CHAIN_ID]) {
      handlePay()
    }
    // Free articles get auto-access
    if (isFree) setAccess(true)
  }, [access, initiaAddress, article, onChainArticle]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePay() {
    if (paying || access) return
    setPaying(true)
    try {
      const messages = [{
        typeUrl: '/minievm.evm.v1.MsgCall',
        value: {
          sender: initiaAddress.toLowerCase(),
          contractAddr: CONTRACTS.microPayment,
          input: encodePayForRead(articleId),
          value: '0',
          accessList: [],
          authList: [],
        },
      }]

      const isAutoPayEnabled = autoSign?.isEnabledByChain?.[ROLLUP_CHAIN_ID]
      if (isAutoPayEnabled && submitTxBlock) {
        // Headless auto-pay: submitTxBlock signs with session wallet, no popup
        const gasEstimate = await estimateGas({ messages })
        const { calculateFee, GasPrice } = await import('@cosmjs/stargate')
        const fee = calculateFee(Math.ceil(gasEstimate * 1.5), GasPrice.fromString('0umin'))
        await submitTxBlock({ messages, fee })
      } else {
        // Manual pay: requestTxBlock shows wallet confirmation
        await requestTxBlock({
          chainId: ROLLUP_CHAIN_ID,
          messages,
        })
      }
      setAccess(true)
    } catch (e) {
      if (e?.message?.includes('Already read')) {
        setAccess(true)
      } else if (e?.message?.includes('Article inactive')) {
        // Article was deactivated by the author
        setAccess(false)
      } else {
        console.error('Payment failed:', e)
      }
    }
    setPaying(false)
  }

  if (loading) {
    return (
      <div className="page">
        <div className="container article-reader">
          <div className="skeleton skeleton-title" style={{ width: '80%', height: '2rem' }} />
          <div className="skeleton skeleton-text" style={{ marginTop: '1rem' }} />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" style={{ width: '70%' }} />
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="page">
        <div className="container article-reader" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <h2>Article not found</h2>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Home</Link>
        </div>
      </div>
    )
  }

  const isInactive = onChainArticle && !onChainArticle.isActive

  // For demo, show content directly since contracts may not be deployed
  const showContent = access || !initiaAddress || !CONTRACTS.microPayment || CONTRACTS.microPayment === '0x0000000000000000000000000000000000000000'

  return (
    <div className="page">
      <div className="container article-reader">
        <AutoSignBanner />

        {isInactive && (
          <div className="alert alert-danger">
            This article has been deactivated by the author and is no longer available for reading.
          </div>
        )}

        <h1>{article.title}</h1>
        <div className="article-reader-meta">
          <ReadingTimeEstimate minutes={article.reading_time} />
          {score !== null && <QualityBadge score={score} />}
          <VerifiedBadge isVerified={verified} />
          <BoostButton articleId={articleId} />
        </div>

        {article.summary && (
          <div className="article-summary">
            <strong>Summary:</strong> {article.summary}
          </div>
        )}

        {showContent ? (
          <div className="article-content">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
        ) : (
          <div>
            <div className="article-content" style={{ maxHeight: '220px', overflow: 'hidden' }}>
              <ReactMarkdown>{article.content.slice(0, 500) + '...'}</ReactMarkdown>
            </div>
            <div className="paywall">
              <h3>Continue reading</h3>
              <p>{paying ? 'Processing payment...' : `Pay ${formatMIN(article.pricePerRead || 0)} MIN to unlock this article`}</p>
              <button className="btn btn-primary btn-lg" onClick={handlePay} disabled={paying}>
                {paying ? 'Unlocking...' : 'Unlock Article'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
