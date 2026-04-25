import { useState, useEffect } from 'react'
import { useInterwovenKit } from '@initia/interwovenkit-react'
import { listArticles, getRecommendations, getArticleContent } from '../lib/ai'
import { getArticle, getDynamicPrice } from '../lib/evm'
import ArticleCard from '../components/ArticleCard'
import AutoSignBanner from '../components/AutoSignBanner'

export default function Home() {
  const { initiaAddress } = useInterwovenKit()
  const [articles, setArticles] = useState([])
  const [onChainData, setOnChainData] = useState({})
  const [dynamicPrices, setDynamicPrices] = useState({})
  const [recommendations, setRecommendations] = useState([])
  const [recReasons, setRecReasons] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadArticles() }, [])
  useEffect(() => {
    if (initiaAddress && articles.length > 0) loadRecommendations()
  }, [initiaAddress, articles])

  async function loadArticles() {
    try {
      const data = await listArticles()
      setArticles(data)
      const chainData = {}
      const prices = {}
      await Promise.all(data.map(async (a) => {
        try {
          const onChain = await getArticle(a.article_id)
          if (onChain && onChain.author !== '0x0000000000000000000000000000000000000000') {
            chainData[a.article_id] = onChain
            const dp = await getDynamicPrice(a.article_id)
            if (dp !== null) prices[a.article_id] = dp
          }
        } catch {}
      }))
      setOnChainData(chainData)
      setDynamicPrices(prices)
    } catch (e) {
      console.error('Failed to load articles:', e)
    }
    setLoading(false)
  }

  async function loadRecommendations() {
    try {
      const result = await getRecommendations(initiaAddress, [], 4)
      if (result?.recommended_article_ids?.length > 0) {
        const recArticles = []
        const reasons = {}
        if (result.recommendations) {
          for (const rec of result.recommendations) reasons[rec.article_id] = rec.reason
        }
        for (const id of result.recommended_article_ids.slice(0, 4)) {
          try {
            const content = await getArticleContent(id)
            if (content) recArticles.push({ ...content, article_id: id })
          } catch {}
        }
        setRecommendations(recArticles)
        setRecReasons(reasons)
      }
    } catch (e) {
      console.error('Failed to load recommendations:', e)
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="hero">
          <div className="hero-eyebrow">The future of content is here</div>
          <h1>
            Every read <span className="hero-accent">rewards</span><br />
            the creator<span className="hero-dot">.</span>
          </h1>
          <p>
            No subscriptions. No algorithms deciding your paycheck.<br />
            Just readers, creators, and micropayments that flow directly with <strong>97.5%</strong> going to the writer.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">97.5%</span>
              <span className="hero-stat-label">To creators</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">$0.01</span>
              <span className="hero-stat-label">Per article</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">0 popups</span>
              <span className="hero-stat-label">Auto-pay reads</span>
            </div>
          </div>
        </div>

        <AutoSignBanner />

        {recommendations.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Recommended for You</h2>
              <span className="section-subtitle">Personalized by AI</span>
            </div>
            <div className="article-grid" style={{ marginBottom: '3rem' }}>
              {recommendations.map(article => (
                <ArticleCard
                  key={`rec-${article.article_id}`}
                  article={onChainData[article.article_id] || null}
                  metadata={article}
                  qualityScore={article.quality_score ? article.quality_score * 10 : null}
                  dynamicPrice={dynamicPrices[article.article_id]}
                  reason={recReasons[article.article_id]}
                />
              ))}
            </div>
          </>
        )}

        <div className="section-header">
          <h2 className="section-title">Latest Articles</h2>
        </div>

        {loading ? (
          <div className="article-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card article-card">
                <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text" style={{ width: '60%' }} />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>No articles yet</p>
            <p style={{ color: 'var(--fg-muted)' }}>Be the first to publish something great.</p>
          </div>
        ) : (
          <div className="article-grid">
            {articles.map(article => (
              <ArticleCard
                key={article.article_id}
                article={onChainData[article.article_id] || null}
                metadata={article}
                qualityScore={article.quality_score ? article.quality_score * 10 : null}
                dynamicPrice={dynamicPrices[article.article_id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
