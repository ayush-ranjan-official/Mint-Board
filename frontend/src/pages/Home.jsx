import { useState, useEffect } from 'react'
import { listArticles } from '../lib/ai'
import { getArticle } from '../lib/evm'
import ArticleCard from '../components/ArticleCard'
import AutoSignBanner from '../components/AutoSignBanner'

export default function Home() {
  const [articles, setArticles] = useState([])
  const [onChainData, setOnChainData] = useState({}) // articleId => on-chain article
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadArticles()
  }, [])

  async function loadArticles() {
    try {
      const data = await listArticles()
      setArticles(data)

      // Fetch on-chain data for each article (totalReads, price, etc.)
      const chainData = {}
      await Promise.all(
        data.map(async (a) => {
          try {
            const onChain = await getArticle(a.article_id)
            if (onChain && onChain.author !== '0x0000000000000000000000000000000000000000') {
              chainData[a.article_id] = onChain
            }
          } catch {}
        })
      )
      setOnChainData(chainData)
    } catch (e) {
      console.error('Failed to load articles:', e)
    }
    setLoading(false)
  }

  return (
    <div className="page">
      <div className="container">
        <div className="hero">
          <h1>Read what matters.<br />Pay what's fair.</h1>
          <p>
            Discover quality articles from independent creators.
            Pay per read — no subscriptions. Creators keep 97%.
          </p>
        </div>

        <AutoSignBanner />

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
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--fg-muted)' }}>No articles yet. Be the first to publish!</p>
          </div>
        ) : (
          <div className="article-grid">
            {articles.map(article => (
              <ArticleCard
                key={article.article_id}
                article={onChainData[article.article_id] || null}
                metadata={article}
                qualityScore={article.quality_score ? article.quality_score * 10 : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
