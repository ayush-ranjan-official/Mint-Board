import { Link } from 'react-router-dom'
import { formatUnits } from 'viem'
import QualityBadge from './QualityBadge'
import ReadingTimeEstimate from './ReadingTimeEstimate'

export default function ArticleCard({ article, metadata, qualityScore }) {
  const priceWei = article?.pricePerRead || 0n
  const price = Number(formatUnits(typeof priceWei === 'bigint' ? priceWei : BigInt(priceWei || 0), 18))
  const isFree = price === 0
  const articleId = article?.id !== undefined ? Number(article.id) : metadata?.article_id

  // Parse metadata from contract JSON or AI service data
  let title = metadata?.title || 'Untitled'
  let summary = metadata?.summary || ''
  let readingTime = metadata?.reading_time || metadata?.readingTimeMinutes || 0
  let tags = metadata?.tags || []
  let author = article?.author

  // Try parsing on-chain metadataJSON
  if (article?.metadataJSON) {
    try {
      const parsed = JSON.parse(article.metadataJSON)
      title = parsed.title || title
      summary = parsed.summary || summary
      readingTime = parsed.readingTime || readingTime
    } catch (e) {}
  }

  // Shorten author address
  const shortAuthor = author
    ? author.slice(0, 6) + '...' + author.slice(-4)
    : ''

  return (
    <Link to={`/article/${articleId}`} style={{ textDecoration: 'none' }}>
      <div className="card card-clickable article-card">
        <div className="article-card-meta">
          {shortAuthor && <span>{shortAuthor}</span>}
          <ReadingTimeEstimate minutes={readingTime} />
          {qualityScore !== undefined && qualityScore !== null && (
            <QualityBadge score={Number(qualityScore)} />
          )}
        </div>
        <div className="article-card-title">{title}</div>
        {summary && <div className="article-card-summary">{summary}</div>}
        <div className="article-card-footer">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="badge badge-tag">{tag}</span>
            ))}
            {article?.totalReads > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>
                {Number(article.totalReads)} reads
              </span>
            )}
          </div>
          <span className={`article-price ${isFree ? 'free' : ''}`}>
            {isFree ? 'Free' : `${price.toFixed(4)} MIN`}
          </span>
        </div>
      </div>
    </Link>
  )
}
