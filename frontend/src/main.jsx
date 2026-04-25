import { Buffer } from 'buffer'
window.Buffer = Buffer
window.process = { env: { NODE_ENV: 'development' } }

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import "@initia/interwovenkit-react/styles.css"
import { initiaPrivyWalletConnector, injectStyles, InterwovenKitProvider, TESTNET } from "@initia/interwovenkit-react"
import InterwovenKitStyles from "@initia/interwovenkit-react/styles.js"
import { WagmiProvider, createConfig, http } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import App from './App.jsx'
import './index.css'

injectStyles(InterwovenKitStyles)

// MintBoard EVM chain definition (testnet only — zero real value)
const mintboardEvm = {
  id: 1948352899732069,
  name: 'MintBoard',
  nativeCurrency: { name: 'MIN', symbol: 'MIN', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
  },
}

const queryClient = new QueryClient()
const wagmiConfig = createConfig({
  connectors: [initiaPrivyWalletConnector],
  chains: [mintboardEvm],
  transports: { [mintboardEvm.id]: http() },
})

// MintBoard Appchain Configuration
const customChain = {
  chain_id: 'mintboard-1',
  chain_name: 'mintboard',
  pretty_name: 'MintBoard',
  network_type: 'testnet',
  bech32_prefix: 'init',
  logo_URIs: {
    png: 'https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.png',
  },
  apis: {
    rpc: [{ address: 'http://localhost:26657' }],
    rest: [{ address: 'http://localhost:1317' }],
    indexer: [{ address: 'http://localhost:8080' }],
    'json-rpc': [{ address: 'http://localhost:8545' }],
  },
  fees: {
    fee_tokens: [{
      denom: 'umin',
      fixed_min_gas_price: 0,
      low_gas_price: 0,
      average_gas_price: 0,
      high_gas_price: 0,
    }],
  },
  staking: { staking_tokens: [{ denom: 'umin' }] },
  metadata: { is_l1: false, minitia: { type: 'minievm' } },
  native_assets: [{
    denom: 'umin',
    name: 'MIN',
    symbol: 'MIN',
    decimals: 18,
  }],
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <InterwovenKitProvider
          {...TESTNET}
          defaultChainId={customChain.chain_id}
          customChain={customChain}
          customChains={[customChain]}
          enableAutoSign={{
            'mintboard-1': [
              '/minievm.evm.v1.MsgCall',
              '/cosmos.bank.v1beta1.MsgSend',
            ],
          }}
        >
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </InterwovenKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
