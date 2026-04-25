import { AI_SERVICE_URL } from '../config/chains'

export async function analyzeContent(title, content) {
  const res = await fetch(`${AI_SERVICE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  })
  if (!res.ok) throw new Error('Analysis failed')
  return res.json()
}

export async function storeArticle(data) {
  const res = await fetch(`${AI_SERVICE_URL}/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Store failed')
  return res.json()
}

export async function getArticleContent(articleId) {
  const res = await fetch(`${AI_SERVICE_URL}/articles/${articleId}`)
  if (!res.ok) return null
  return res.json()
}

export async function listArticles() {
  const res = await fetch(`${AI_SERVICE_URL}/articles`)
  if (!res.ok) return []
  return res.json()
}

export async function getRecommendations(readerAddress, readIds = [], limit = 5) {
  const params = new URLSearchParams({
    reader_address: readerAddress || '',
    limit: String(limit),
    read_ids: readIds.join(','),
  })
  const res = await fetch(`${AI_SERVICE_URL}/recommend?${params}`)
  if (!res.ok) return { recommended_article_ids: [], reasoning: '' }
  return res.json()
}
