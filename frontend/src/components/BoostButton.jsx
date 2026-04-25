import { useState, useEffect } from 'react'
import { useInterwovenKit } from '@initia/interwovenkit-react'
import { CONTRACTS, ROLLUP_CHAIN_ID, UMIN_ERC20 } from '../config/chains'
import { encodeBoostArticle, encodeApprove, parseMIN, getBoostAmount, formatMIN } from '../lib/evm'

export default function BoostButton({ articleId }) {
  const { initiaAddress, autoSign, requestTxBlock, submitTxBlock, estimateGas } = useInterwovenKit()
  const [loading, setLoading] = useState(false)
  const [boosted, setBoosted] = useState(false)
  const [totalBoost, setTotalBoost] = useState(null)

  useEffect(() => {
    getBoostAmount(articleId).then(b => {
      if (b > 0n) {
        setTotalBoost(b)
        setBoosted(true)
      }
    }).catch(() => {})
  }, [articleId])

  if (!initiaAddress) return null

  const isAutoPayEnabled = autoSign?.isEnabledByChain?.[ROLLUP_CHAIN_ID]

  async function sendTx(messages) {
    if (isAutoPayEnabled && submitTxBlock) {
      const gasEstimate = await estimateGas({ messages })
      const { calculateFee, GasPrice } = await import('@cosmjs/stargate')
      const fee = calculateFee(Math.ceil(gasEstimate * 1.5), GasPrice.fromString('0umin'))
      await submitTxBlock({ messages, fee })
    } else {
      await requestTxBlock({ chainId: ROLLUP_CHAIN_ID, messages })
    }
  }

  const handleBoost = async () => {
    setLoading(true)
    try {
      const amount = parseMIN('0.1')

      await sendTx([{
        typeUrl: '/minievm.evm.v1.MsgCall',
        value: {
          sender: initiaAddress.toLowerCase(),
          contractAddr: UMIN_ERC20,
          input: encodeApprove(CONTRACTS.curationAgent, amount),
          value: '0',
          accessList: [],
          authList: [],
        },
      }])

      await sendTx([{
        typeUrl: '/minievm.evm.v1.MsgCall',
        value: {
          sender: initiaAddress.toLowerCase(),
          contractAddr: CONTRACTS.curationAgent,
          input: encodeBoostArticle(articleId, amount),
          value: '0',
          accessList: [],
          authList: [],
        },
      }])

      setBoosted(true)
      // Fetch updated total boost
      try {
        const boost = await getBoostAmount(articleId)
        setTotalBoost(boost)
      } catch (_) {}
    } catch (e) {
      console.error('Boost failed:', e)
    }
    setLoading(false)
  }

  if (boosted) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.75rem',
        borderRadius: '6px',
        fontSize: '0.8125rem',
        fontWeight: 600,
        background: 'var(--accent-light, #e6f7f2)',
        color: 'var(--accent, #0d9373)',
      }}>
        Boosted +0.1 MIN
        {totalBoost !== null && ` (${formatMIN(totalBoost)} total)`}
      </span>
    )
  }

  return (
    <button
      className="btn btn-secondary btn-sm"
      onClick={handleBoost}
      disabled={loading}
      title="Stake 0.1 MIN to boost this article's visibility. Curators earn 10% of future reads."
    >
      {loading ? 'Boosting...' : 'Boost'}
    </button>
  )
}
