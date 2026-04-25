import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterwovenKit } from '@initia/interwovenkit-react'
import { analyzeContent, storeArticle } from '../lib/ai'
import { encodePublish, computeContentHash, parseMIN, getNextArticleId } from '../lib/evm'
import { CONTRACTS, ROLLUP_CHAIN_ID } from '../config/chains'
import UsernameDisplay from '../components/UsernameDisplay'

export default function Publish() {
  const { initiaAddress, autoSign, requestTxBlock, submitTxBlock, estimateGas } = useInterwovenKit()
  const isAutoSignEnabled = autoSign?.isEnabledByChain?.[ROLLUP_CHAIN_ID]
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [price, setPrice] = useState('0.01')
  const [tags, setTags] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [step, setStep] = useState('')

  async function handleAnalyze() {
    if (!title || !content) return
    setAnalyzing(true)
    try {
      const result = await analyzeContent(title, content)
      setAnalysis(result)
    } catch (e) {
      console.error('Analysis failed:', e)
    }
    setAnalyzing(false)
  }

  async function handlePublish() {
    if (!initiaAddress || !title || !content) return
    setPublishing(true)

    try {
      // Step 1: Analyze content
      setStep('Analyzing content...')
      let metadata = analysis
      if (!metadata) {
        metadata = await analyzeContent(title, content)
      }

      // Step 2: Get the next on-chain article ID so AI service ID matches
      const nextId = await getNextArticleId()
      const onChainId = Number(nextId)

      // Step 3: Store content in AI service with the same ID as on-chain
      setStep('Storing content...')
      await storeArticle({
        article_id: onChainId,
        title,
        content,
        summary: metadata.summary || '',
        reading_time: metadata.readingTimeMinutes || 1,
        quality_score: metadata.qualityScore || 5.0,
        tags: metadata.tags || tags.split(',').map(t => t.trim()).filter(Boolean),
        seo_description: metadata.seoDescription || '',
      })

      // Step 4: Compute content hash
      const contentHash = computeContentHash(content)
      const priceWei = parseMIN(price || '0')

      const metadataJSON = JSON.stringify({
        title,
        summary: metadata.summary || '',
        readingTime: metadata.readingTimeMinutes || 1,
        qualityScore: metadata.qualityScore || 5.0,
        tags: metadata.tags || [],
      })

      const contentCID = String(onChainId)

      // Step 4: Publish on-chain
      setStep('Publishing on-chain...')
      const input = encodePublish(contentCID, metadataJSON, priceWei, contentHash)

      const messages = [{
        typeUrl: '/minievm.evm.v1.MsgCall',
        value: {
          sender: initiaAddress.toLowerCase(),
          contractAddr: CONTRACTS.contentRegistry,
          input,
          value: '0',
          accessList: [],
          authList: [],
        },
      }]
      if (isAutoSignEnabled && submitTxBlock) {
        const gasEstimate = await estimateGas({ messages })
        const { calculateFee, GasPrice } = await import('@cosmjs/stargate')
        const fee = calculateFee(Math.ceil(gasEstimate * 1.5), GasPrice.fromString('0umin'))
        await submitTxBlock({ messages, fee })
      } else {
        await requestTxBlock({ chainId: ROLLUP_CHAIN_ID, messages })
      }

      setStep('Published!')
      setTimeout(() => navigate('/'), 1500)
    } catch (e) {
      console.error('Publish failed:', e)
      setStep('Failed — please try again')
    }
    setPublishing(false)
  }

  if (!initiaAddress) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: '640px', textAlign: 'center', padding: '4rem 0' }}>
          <h2>Connect your wallet to publish</h2>
          <p style={{ color: 'var(--fg-muted)', marginTop: '0.5rem' }}>
            You need a connected wallet to publish articles on MintBoard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '720px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Publish an Article</h1>
        <p style={{ color: 'var(--fg-muted)', marginBottom: '2rem' }}>
          Publishing as <UsernameDisplay />
        </p>

        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            className="form-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Your article title"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Content (Markdown supported)</label>
          <textarea
            className="form-textarea"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your article here..."
            rows={12}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Price per read (MIN)</label>
            <input
              className="form-input"
              type="number"
              step="0.001"
              min="0"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0.01"
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Tags (comma-separated)</label>
            <input
              className="form-input"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="DeFi, Tutorial, Beginner"
            />
          </div>
        </div>

        {!analysis && (
          <button
            className="btn btn-secondary"
            onClick={handleAnalyze}
            disabled={analyzing || !title || !content}
            style={{ marginBottom: '1rem' }}
          >
            {analyzing ? 'Analyzing...' : 'Preview AI Analysis'}
          </button>
        )}

        {analysis && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>AI Analysis</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--fg-muted)' }}><strong>Summary:</strong> {analysis.summary}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--fg-muted)', marginTop: '0.5rem' }}>
              <strong>Reading time:</strong> {analysis.readingTimeMinutes} min |
              <strong> Quality score:</strong> {analysis.qualityScore}/10 |
              <strong> Tags:</strong> {(analysis.tags || []).join(', ')}
            </p>
          </div>
        )}

        <button
          className="btn btn-primary btn-lg"
          onClick={handlePublish}
          disabled={publishing || !title || !content}
          style={{ width: '100%' }}
        >
          {publishing ? step : 'Publish Article'}
        </button>
      </div>
    </div>
  )
}
