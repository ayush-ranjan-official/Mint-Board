import { useInterwovenKit } from '@initia/interwovenkit-react'
import { ROLLUP_CHAIN_ID } from '../config/chains'

export function useAutoSign() {
  const { autoSign } = useInterwovenKit()

  const isEnabled = autoSign?.isEnabledByChain?.[ROLLUP_CHAIN_ID] || false

  const enable = async () => {
    await autoSign?.enable(ROLLUP_CHAIN_ID, {
      permissions: ['/minievm.evm.v1.MsgCall', '/cosmos.bank.v1beta1.MsgSend'],
    })
  }

  const disable = async () => {
    await autoSign?.disable(ROLLUP_CHAIN_ID)
  }

  return { isEnabled, enable, disable, autoSign }
}
