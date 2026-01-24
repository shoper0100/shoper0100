import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { bsc } from 'wagmi/chains'

// 1. Get Project ID from env
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '85bbe92e974bca9f67c7910e0d1365ea'

// 2. Create wagmiConfig
const metadata = {
    name: 'GREAT INVESTOR CLUB',
    description: 'GREAT INVESTOR CLUB - Decentralized Matrix Platform',
    url: 'https://gic-club.vercel.app', // origin must match your domain & subdomain
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

// Add BSC chain configuration
declare module 'wagmi' {
    interface Register {
        config: typeof config
    }
}

// Export projectId and metadata for use in providers
export { projectId, metadata }
