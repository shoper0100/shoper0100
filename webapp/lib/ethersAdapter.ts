import { type PublicClient, type WalletClient, usePublicClient, useWalletClient } from 'wagmi'
import { BrowserProvider, JsonRpcSigner, FallbackProvider, JsonRpcProvider } from 'ethers'
import { useMemo } from 'react'

export function publicClientToProvider(publicClient: PublicClient) {
    const { chain, transport } = publicClient
    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    }
    if (transport.type === 'fallback')
        return new FallbackProvider(
            (transport.transports as ReturnType<typeof transport['transports']>).map(
                ({ value }) => new JsonRpcProvider(value?.url, network),
            ),
            network,
        )
    return new JsonRpcProvider(transport.url, network)
}

/** Hook to convert a viem Public Client to an ethers.js Provider. */
export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
    const publicClient = usePublicClient({ chainId })
    return useMemo(
        () => (publicClient ? publicClientToProvider(publicClient) : undefined),
        [publicClient],
    )
}

export function walletClientToSigner(walletClient: WalletClient) {
    const { account, chain, transport } = walletClient
    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    }
    const provider = new BrowserProvider(transport, network)
    const signer = new JsonRpcSigner(provider, account.address)
    return signer
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
    const { data: walletClient } = useWalletClient({ chainId })
    return useMemo(
        () => (walletClient ? walletClientToSigner(walletClient) : undefined),
        [walletClient],
    )
}
