import { CONTRACTS } from '../config/chains'

// ContentRegistry ABI (minimal for frontend reads/writes)
export const CONTENT_REGISTRY_ABI = [
  {
    inputs: [],
    name: 'nextArticleId',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'uint256' }],
    name: 'getArticle',
    outputs: [{
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'author', type: 'address' },
        { name: 'contentCID', type: 'string' },
        { name: 'metadataJSON', type: 'string' },
        { name: 'pricePerRead', type: 'uint256' },
        { name: 'publishedAt', type: 'uint256' },
        { name: 'totalReads', type: 'uint256' },
        { name: 'isActive', type: 'bool' },
        { name: 'contentHash', type: 'bytes32' },
      ],
      type: 'tuple',
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'count', type: 'uint256' }, { name: 'offset', type: 'uint256' }],
    name: 'getLatestArticles',
    outputs: [{
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'author', type: 'address' },
        { name: 'contentCID', type: 'string' },
        { name: 'metadataJSON', type: 'string' },
        { name: 'pricePerRead', type: 'uint256' },
        { name: 'publishedAt', type: 'uint256' },
        { name: 'totalReads', type: 'uint256' },
        { name: 'isActive', type: 'bool' },
        { name: 'contentHash', type: 'bytes32' },
      ],
      type: 'tuple[]',
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'author', type: 'address' }],
    name: 'getAuthorArticles',
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'uint256' }, { name: 'hash', type: 'bytes32' }],
    name: 'verifyContent',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'uint256' }],
    name: 'deactivate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'contentCID', type: 'string' },
      { name: 'metadataJSON', type: 'string' },
      { name: 'pricePerRead', type: 'uint256' },
      { name: 'contentHash', type: 'bytes32' },
    ],
    name: 'publish',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

// MicroPayment ABI
export const MICRO_PAYMENT_ABI = [
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'readerBalances',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'creatorEarnings',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'protocolTreasury',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'reader', type: 'address' }, { name: 'articleId', type: 'uint256' }],
    name: 'hasAccess',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }, { name: '', type: 'uint256' }],
    name: 'hasRead',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'articleId', type: 'uint256' }],
    name: 'payForRead',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdrawReaderBalance',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'articleId', type: 'uint256' }],
    name: 'claimCuratorRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'curator', type: 'address' }, { name: 'articleId', type: 'uint256' }],
    name: 'pendingCuratorRewards',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'articleId', type: 'uint256' }],
    name: 'getDynamicPrice',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'curatorRewardPool',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

// CurationAgent ABI
export const CURATION_AGENT_ABI = [
  {
    inputs: [{ name: 'articleId', type: 'uint256' }],
    name: 'getScore',
    outputs: [{
      components: [
        { name: 'score', type: 'uint256' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'scoredBy', type: 'address' },
        { name: 'reasonHash', type: 'string' },
      ],
      type: 'tuple',
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'articleId', type: 'uint256' }],
    name: 'getBoostAmount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getFeaturedArticles',
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'articleId', type: 'uint256' }, { name: 'amount', type: 'uint256' }],
    name: 'boostArticle',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'articleId', type: 'uint256' }],
    name: 'withdrawBoost',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }, { name: '', type: 'uint256' }],
    name: 'curatorStakes',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'totalBoosts',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

export function getContractAddresses() {
  return CONTRACTS
}
