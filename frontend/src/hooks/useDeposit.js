import { useState } from 'react'
import { useInterwovenKit } from '@initia/interwovenkit-react'
import { encodeDeposit, encodeApprove, parseMIN } from '../lib/evm'
import { CONTRACTS, ROLLUP_CHAIN_ID, UMIN_ERC20 } from '../config/chains'
import { useAutoSign } from './useAutoSign'

export function useDeposit() {
  const { initiaAddress, requestTxBlock, submitTxBlock, estimateGas } = useInterwovenKit()
  const { isEnabled: isAutoPayEnabled } = useAutoSign()
  const [depositing, setDepositing] = useState(false)

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

  const deposit = async (amountMIN) => {
    if (!initiaAddress || depositing) return false
    setDepositing(true)
    try {
      const value = parseMIN(amountMIN)

      // Step 1: Approve
      await sendTx([{
        typeUrl: '/minievm.evm.v1.MsgCall',
        value: {
          sender: initiaAddress.toLowerCase(),
          contractAddr: UMIN_ERC20,
          input: encodeApprove(CONTRACTS.microPayment, value),
          value: '0', accessList: [], authList: [],
        },
      }])

      // Step 2: Deposit
      await sendTx([{
        typeUrl: '/minievm.evm.v1.MsgCall',
        value: {
          sender: initiaAddress.toLowerCase(),
          contractAddr: CONTRACTS.microPayment,
          input: encodeDeposit(value),
          value: '0', accessList: [], authList: [],
        },
      }])

      setDepositing(false)
      return true
    } catch (e) {
      console.error('Deposit failed:', e)
      setDepositing(false)
      return false
    }
  }

  return { deposit, depositing }
}
