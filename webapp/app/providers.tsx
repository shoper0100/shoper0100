'use client'

import { WagmiProvider } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { config, projectId } from '@/lib/web3'
import { ReactNode } from 'react'

const queryClient = new QueryClient()

// Create modal once
createWeb3Modal({
    wagmiConfig: config,
    projectId,
    defaultChain: bsc,
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#F0B90B', // BNB Yellow
        '--w3m-border-radius-master': '1px'
    },
    featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0'  // Trust Wallet
    ],
    enableAnalytics: false
})

export function Providers({ children }: { children: ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    )
}
