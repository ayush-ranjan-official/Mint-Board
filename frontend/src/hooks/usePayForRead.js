import { useState } from 'react'
import { useInterwovenKit } from '@initia/interwovenkit-react'
import { encodePayForRead } from '../lib/evm'
import { CONTRACTS, ROLLUP_CHAIN_ID } from '../config/chains'
import { useAutoSign } from './useAutoSign'

export function usePayForRead() {
  const { initiaAddress, requestTxBlock, submitTxBlock, estimateGas } = useInterwovenKit()
  const { isEnabled: isAutoPayEnabled } = useAutoSign()
  const [paying, setPaying] = useState(false)

  const payForRead = async (articleId) => {
    if (!initiaAddress || paying) return false
    setPaying(true)
    try {
      const messages = [{
        typeUrl: '/minievm.evm.v1.MsgCall',
        value: {
          sender: initiaAddress.toLowerCase(),
          contractAddr: CONTRACTS.microPayment,
          input: encodePayForRead(articleId),
          value: '0',
          accessList: [],
          authList: [],
        },
      }]

      if (isAutoPayEnabled && submitTxBlock) {
        const gasEstimate = await estimateGas({ messages })
        const { calculateFee, GasPrice } = await import('@cosmjs/stargate')
        const fee = calculateFee(Math.ceil(gasEstimate * 1.5), GasPrice.fromString('0umin'))
        await submitTxBlock({ messages, fee })
      } else {
        await requestTxBlock({ chainId: ROLLUP_CHAIN_ID, messages })
      }
      setPaying(false)
      return true
    } catch (e) {
      setPaying(false)
      if (e?.message?.includes('Already read')) return true
      if (e?.message?.includes('Article inactive')) return false
      console.error('Payment failed:', e)
      return false
    }
  }

  return { payForRead, paying }
}
