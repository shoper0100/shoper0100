import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { bsc } from 'wagmi/chains'
import { createWeb3Modal } from '@web3modal/wagmi/react'

// 1. Get Project ID from env
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '85bbe92e974bca9f67c7910e0d1365ea'

// 2. Create wagmiConfig
const metadata = {
    name: 'FiveDollarBNB',
    description: 'Five Dollar BNB - Decentralized Matrix Platform',
    url: 'https://fivedollarbnb.vercel.app', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/37784886']
}

export const chains = [bsc] as const
export const config = defaultWagmiConfig({
    chains,
    projectId,
    metadata,
    enableWalletConnect: true, // Optional - true by default
    enableInjected: true, // Optional - true by default
    enableEIP6963: true, // Optional - true by default
    enableCoinbase: true, // Optional - true by default
})

// 3. Create modal
createWeb3Modal({
    wagmiConfig: config,
    projectId,
    defaultChain: bsc,
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#F0B90B', // BNB Yellow
        '--w3m-border-radius-master': '1px'
    }
})
