import { useInterwovenKit } from '@initia/interwovenkit-react'
import { ROLLUP_CHAIN_ID } from '../config/chains'

export default function AutoSignBanner() {
  const { initiaAddress, autoSign } = useInterwovenKit()

  if (!initiaAddress) return null

  const isEnabled = autoSign?.isEnabledByChain?.[ROLLUP_CHAIN_ID]
  if (isEnabled) return null

  const handleEnable = async () => {
    try {
      await autoSign?.enable(ROLLUP_CHAIN_ID, {
        permissions: ['/minievm.evm.v1.MsgCall', '/cosmos.bank.v1beta1.MsgSend'],
      })
    } catch (e) {
      console.error('Auto-sign enable failed:', e)
    }
  }

  return (
    <div className="autosign-banner">
      <div className="autosign-banner-text">
        <strong>Enable auto-pay:</strong> Approve once, then read articles seamlessly without wallet popups.
      </div>
      <button className="btn btn-primary btn-sm" onClick={handleEnable}>
        Enable Auto-Pay
      </button>
    </div>
  )
}
