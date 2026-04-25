import { useInterwovenKit } from '@initia/interwovenkit-react'

export default function BridgeButton() {
  const { openBridge } = useInterwovenKit()

  const handleBridge = () => {
    openBridge({
      srcChainId: 'initiation-2',
      srcDenom: 'uinit',
    })
  }

  return (
    <button className="btn btn-secondary" onClick={handleBridge}>
      Bridge from L1
    </button>
  )
}
