import { useState, useEffect } from 'react'
import { listArticles, getArticleContent } from '../lib/ai'
import { getArticle, getDynamicPrice } from '../lib/evm'

export function useArticles() {
  const [articles, setArticles] = useState([])
  const [onChainData, setOnChainData] = useState({})
  const [dynamicPrices, setDynamicPrices] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadArticles()
  }, [])

  async function loadArticles() {
    try {
      const data = await listArticles()
      setArticles(data)

      const chainData = {}
      const prices = {}
      await Promise.all(
        data.map(async (a) => {
          try {
            const onChain = await getArticle(a.article_id)
            if (onChain && onChain.author !== '0x0000000000000000000000000000000000000000') {
              chainData[a.article_id] = onChain
              const dp = await getDynamicPrice(a.article_id)
              if (dp !== null) prices[a.article_id] = dp
            }
          } catch {}
        })
      )
      setOnChainData(chainData)
      setDynamicPrices(prices)
    } catch (e) {
      console.error('Failed to load articles:', e)
    }
    setLoading(false)
  }

  return { articles, onChainData, dynamicPrices, loading, reload: loadArticles }
}

export function useArticleContent(articleId) {
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getArticleContent(articleId)
      .then(data => { if (data) setArticle(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [articleId])

  return { article, loading }
}
