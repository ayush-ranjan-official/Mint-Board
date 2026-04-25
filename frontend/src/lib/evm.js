import { encodeFunctionData, formatUnits, parseEther, keccak256, toBytes, createPublicClient, http } from 'viem'
import { CONTRACTS, JSON_RPC_URL } from '../config/chains'
import { CONTENT_REGISTRY_ABI, MICRO_PAYMENT_ABI, CURATION_AGENT_ABI } from './contracts'

// Create a public client for read-only queries
const publicClient = createPublicClient({
  transport: http(JSON_RPC_URL),
})

// --- Read functions (via JSON-RPC, no wallet needed) ---

export async function getArticle(articleId) {
  try {
    const data = await publicClient.readContract({
      address: CONTRACTS.contentRegistry,
      abi: CONTENT_REGISTRY_ABI,
      functionName: 'getArticle',
      args: [BigInt(articleId)],
    })
    return data
  } catch (e) {
    console.error('getArticle error:', e)
    return null
  }
}

export async function getLatestArticles(count = 20, offset = 0) {
  try {
    return await publicClient.readContract({
      address: CONTRACTS.contentRegistry,
      abi: CONTENT_REGISTRY_ABI,
      functionName: 'getLatestArticles',
      args: [BigInt(count), BigInt(offset)],
    })
  } catch (e) {
    console.error('getLatestArticles error:', e)
    return []
  }
}

export async function getReaderBalance(readerAddress) {
  try {
    const balance = await publicClient.readContract({
      address: CONTRACTS.microPayment,
      abi: MICRO_PAYMENT_ABI,
      functionName: 'readerBalances',
      args: [readerAddress],
    })
    return balance
  } catch (e) {
    console.error('getReaderBalance error:', e)
    return 0n
  }
}

export async function getCreatorEarnings(creatorAddress) {
  try {
    return await publicClient.readContract({
      address: CONTRACTS.microPayment,
      abi: MICRO_PAYMENT_ABI,
      functionName: 'creatorEarnings',
      args: [creatorAddress],
    })
  } catch (e) {
    console.error('getCreatorEarnings error:', e)
    return 0n
  }
}

export async function hasAccess(readerAddress, articleId) {
  try {
    return await publicClient.readContract({
      address: CONTRACTS.microPayment,
      abi: MICRO_PAYMENT_ABI,
      functionName: 'hasAccess',
      args: [readerAddress, BigInt(articleId)],
    })
  } catch (e) {
    return false
  }
}

export async function getQualityScore(articleId) {
  try {
    return await publicClient.readContract({
      address: CONTRACTS.curationAgent,
      abi: CURATION_AGENT_ABI,
      functionName: 'getScore',
      args: [BigInt(articleId)],
    })
  } catch (e) {
    return null
  }
}

export async function getBoostAmount(articleId) {
  try {
    return await publicClient.readContract({
      address: CONTRACTS.curationAgent,
      abi: CURATION_AGENT_ABI,
      functionName: 'getBoostAmount',
      args: [BigInt(articleId)],
    })
  } catch (e) {
    return 0n
  }
}

export async function getAuthorArticles(authorAddress) {
  try {
    return await publicClient.readContract({
      address: CONTRACTS.contentRegistry,
      abi: CONTENT_REGISTRY_ABI,
      functionName: 'getAuthorArticles',
      args: [authorAddress],
    })
  } catch (e) {
    return []
  }
}

// --- Encode transaction data for InterwovenKit ---

export function encodePayForRead(articleId) {
  return encodeFunctionData({
    abi: MICRO_PAYMENT_ABI,
    functionName: 'payForRead',
    args: [BigInt(articleId)],
  })
}

export function encodeDeposit(amount) {
  return encodeFunctionData({
    abi: MICRO_PAYMENT_ABI,
    functionName: 'deposit',
    args: [BigInt(amount)],
  })
}

// ERC20 approve for the umin token
const ERC20_APPROVE_ABI = [{
  type: 'function',
  name: 'approve',
  inputs: [
    { name: 'spender', type: 'address' },
    { name: 'amount', type: 'uint256' },
  ],
  outputs: [{ type: 'bool' }],
  stateMutability: 'nonpayable',
}]

export function encodeApprove(spender, amount) {
  return encodeFunctionData({
    abi: ERC20_APPROVE_ABI,
    functionName: 'approve',
    args: [spender, BigInt(amount)],
  })
}

export function encodeWithdraw() {
  return encodeFunctionData({
    abi: MICRO_PAYMENT_ABI,
    functionName: 'withdraw',
    args: [],
  })
}

export function encodeWithdrawReaderBalance() {
  return encodeFunctionData({
    abi: MICRO_PAYMENT_ABI,
    functionName: 'withdrawReaderBalance',
    args: [],
  })
}

export function encodePublish(contentCID, metadataJSON, pricePerRead, contentHash) {
  return encodeFunctionData({
    abi: CONTENT_REGISTRY_ABI,
    functionName: 'publish',
    args: [contentCID, metadataJSON, pricePerRead, contentHash],
  })
}

export function encodeBoostArticle(articleId, amount) {
  return encodeFunctionData({
    abi: CURATION_AGENT_ABI,
    functionName: 'boostArticle',
    args: [BigInt(articleId), BigInt(amount)],
  })
}

export async function verifyContent(articleId, hash) {
  try {
    return await publicClient.readContract({
      address: CONTRACTS.contentRegistry,
      abi: CONTENT_REGISTRY_ABI,
      functionName: 'verifyContent',
      args: [BigInt(articleId), hash],
    })
  } catch (e) { return null }
}

export async function getDynamicPrice(articleId) {
  try {
    return await publicClient.readContract({
      address: CONTRACTS.microPayment,
      abi: MICRO_PAYMENT_ABI,
      functionName: 'getDynamicPrice',
      args: [BigInt(articleId)],
    })
  } catch (e) { return null }
}

export function encodeDeactivate(articleId) {
  return encodeFunctionData({
    abi: CONTENT_REGISTRY_ABI,
    functionName: 'deactivate',
    args: [BigInt(articleId)],
  })
}

export function encodeWithdrawBoost(articleId) {
  return encodeFunctionData({
    abi: CURATION_AGENT_ABI,
    functionName: 'withdrawBoost',
    args: [BigInt(articleId)],
  })
}

export function encodeClaimCuratorRewards(articleId) {
  return encodeFunctionData({
    abi: MICRO_PAYMENT_ABI,
    functionName: 'claimCuratorRewards',
    args: [BigInt(articleId)],
  })
}

export async function getCuratorStake(curatorAddress, articleId) {
  try {
    return await publicClient.readContract({
      address: CONTRACTS.curationAgent,
      abi: CURATION_AGENT_ABI,
      functionName: 'curatorStakes',
      args: [curatorAddress, BigInt(articleId)],
    })
  } catch (e) { return 0n }
}

export async function getPendingCuratorRewards(curatorAddress, articleId) {
  try {
    return await publicClient.readContract({
      address: CONTRACTS.microPayment,
      abi: MICRO_PAYMENT_ABI,
      functionName: 'pendingCuratorRewards',
      args: [curatorAddress, BigInt(articleId)],
    })
  } catch (e) { return 0n }
}

export async function getFeaturedArticles() {
  try {
    return await publicClient.readContract({
      address: CONTRACTS.curationAgent,
      abi: CURATION_AGENT_ABI,
      functionName: 'getFeaturedArticles',
    })
  } catch (e) { return [] }
}

export async function getNextArticleId() {
  try {
    return await publicClient.readContract({
      address: CONTRACTS.contentRegistry,
      abi: CONTENT_REGISTRY_ABI,
      functionName: 'nextArticleId',
    })
  } catch (e) { return 0n }
}

// --- Utility ---

export function formatMIN(wei) {
  if (!wei) return '0'
  return formatUnits(typeof wei === 'bigint' ? wei : BigInt(wei), 18)
}

export function parseMIN(amount) {
  return parseEther(String(amount))
}

export function computeContentHash(content) {
  return keccak256(toBytes(content))
}
