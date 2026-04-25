import { Link } from 'react-router-dom'
import { formatUnits } from 'viem'
import QualityBadge from './QualityBadge'
import ReadingTimeEstimate from './ReadingTimeEstimate'

export default function ArticleCard({ article, metadata, qualityScore, dynamicPrice, reason }) {
  const priceWei = article?.pricePerRead || 0n
  const price = Number(formatUnits(typeof priceWei === 'bigint' ? priceWei : BigInt(priceWei || 0), 18))
  const isFree = price === 0
  const articleId = article?.id !== undefined ? Number(article.id) : metadata?.article_id

  let usdPrice = null
  if (dynamicPrice && !isFree) {
    usdPrice = (price * 2).toFixed(2)
  }

  let title = metadata?.title || 'Untitled'
  let summary = metadata?.summary || ''
  let readingTime = metadata?.reading_time || metadata?.readingTimeMinutes || 0
  let tags = metadata?.tags || []
  let author = article?.author

  if (article?.metadataJSON) {
    try {
      const parsed = JSON.parse(article.metadataJSON)
      title = parsed.title || title
      summary = parsed.summary || summary
      readingTime = parsed.readingTime || readingTime
    } catch (e) {}
  }

  const shortAuthor = author ? author.slice(0, 6) + '...' + author.slice(-4) : ''
  const authorInitial = shortAuthor ? shortAuthor[2]?.toUpperCase() || '?' : ''

  return (
    <Link to={`/article/${articleId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card card-clickable article-card">
        <div className="article-card-meta">
          {shortAuthor && (
            <span className="article-card-author">
              <span className="article-card-author-avatar">{authorInitial}</span>
              {shortAuthor}
            </span>
          )}
          <ReadingTimeEstimate minutes={readingTime} />
          {qualityScore !== undefined && qualityScore !== null && (
            <QualityBadge score={Number(qualityScore)} />
          )}
        </div>

        <div className="article-card-title">{title}</div>
        {summary && <div className="article-card-summary">{summary}</div>}

        {reason && <div className="badge-reason">AI: {reason}</div>}

        <div className="article-card-footer">
          <div className="article-card-tags">
            {tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="badge badge-tag">{tag}</span>
            ))}
            {article?.totalReads > 0 && (
              <span className="article-card-reads">{Number(article.totalReads)} reads</span>
            )}
          </div>
          <span className={`article-price ${isFree ? 'free' : ''}`}>
            {isFree ? 'Free' : (
              <>
                {price.toFixed(4)} MIN
                {usdPrice && <span className="article-price-usd">(~${usdPrice})</span>}
              </>
            )}
          </span>
        </div>
      </div>
    </Link>
  )
}
