'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { config, chains } from '@/lib/web3'
import { ReactNode } from 'react'

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    )
}
