import { ethers } from 'ethers';
import { CONTRACTS } from './contracts';

/**
 * Get a provider that works in the browser without CORS issues
 * Uses MetaMask's provider if available, otherwise returns null
 */
export function getProvider(): ethers.BrowserProvider | null {
    if (typeof window !== 'undefined' && window.ethereum) {
        return new ethers.BrowserProvider(window.ethereum);
    }
    return null;
}

/**
 * Get a read-only provider for blockchain queries
 * Uses MetaMask to avoid CORS issues
 */
export async function getReadOnlyProvider(): Promise<ethers.BrowserProvider> {
    const provider = getProvider();
    if (!provider) {
        throw new Error('Please install MetaMask to view blockchain data');
    }
    return provider;
}

/**
 * Check if user is connected to BSC Mainnet
 */
export async function checkNetwork(): Promise<boolean> {
    const provider = getProvider();
    if (!provider) return false;

    try {
        const network = await provider.getNetwork();
        return Number(network.chainId) === CONTRACTS.chainId;
    } catch {
        return false;
    }
}

/**
 * Switch to BSC Mainnet
 */
export async function switchToBSC(): Promise<void> {
    if (!window.ethereum) {
        throw new Error('MetaMask not installed');
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }], // BSC Mainnet
        });
    } catch (switchError: any) {
        // Chain not added, add it
        if (switchError.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0x38',
                    chainName: CONTRACTS.chainName,
                    nativeCurrency: CONTRACTS.nativeCurrency,
                    rpcUrls: CONTRACTS.rpcUrls,
                    blockExplorerUrls: [CONTRACTS.blockExplorer],
                }],
            });
        } else {
            throw switchError;
        }
    }
}
