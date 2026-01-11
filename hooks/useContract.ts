'use client';

import { useEffect, useState } from 'react';
import { BrowserProvider, Contract, JsonRpcSigner } from 'ethers';
import { RIDEBNB_ADDRESS, CHAIN_ID } from '@/lib/constants';
import { CONTRACT_ABI } from '@/lib/contract';

export function useContract() {
    const [contract, setContract] = useState<Contract | null>(null);
    const [royaltyContract, setRoyaltyContract] = useState<Contract | null>(null);
    const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize provider and check connection
    useEffect(() => {
        const init = async () => {
            if (typeof window !== 'undefined' && window.ethereum) {
                try {
                    const browserProvider = new BrowserProvider(window.ethereum);
                    setProvider(browserProvider);

                    // Check if already connected
                    const accounts = await browserProvider.listAccounts();
                    if (accounts.length > 0) {
                        const signer = await browserProvider.getSigner();
                        const address = await signer.getAddress();
                        const network = await browserProvider.getNetwork();

                        setSigner(signer);
                        setAccount(address);
                        setChainId(Number(network.chainId));
                        setIsConnected(true);

                        // Create contract instance with signer
                        const contractInstance = new Contract(RIDEBNB_ADDRESS, CONTRACT_ABI, signer);
                        setContract(contractInstance);
                    } else {
                        // Create contract instance with provider (read-only)
                        const contractInstance = new Contract(RIDEBNB_ADDRESS, CONTRACT_ABI, browserProvider);
                        setContract(contractInstance);
                    }
                } catch (err) {
                    console.error('Failed to initialize provider:', err);
                    setError(err instanceof Error ? err.message : 'Failed to initialize');
                }
            }
        };

        init();
    }, []);

    // Listen for account changes
    useEffect(() => {
        if (window.ethereum) {
            const handleAccountsChanged = async (accounts: string[]) => {
                if (accounts.length > 0 && provider) {
                    const signer = await provider.getSigner();
                    const address = await signer.getAddress();

                    setSigner(signer);
                    setAccount(address);
                    setIsConnected(true);

                    // Update contract with new signer
                    const contractInstance = new Contract(RIDEBNB_ADDRESS, CONTRACT_ABI, signer);
                    setContract(contractInstance);
                } else {
                    setSigner(null);
                    setAccount(null);
                    setIsConnected(false);

                    // Revert to read-only contract
                    if (provider) {
                        const contractInstance = new Contract(RIDEBNB_ADDRESS, CONTRACT_ABI, provider);
                        setContract(contractInstance);
                    }
                }
            };

            const handleChainChanged = (chainIdHex: string) => {
                const newChainId = parseInt(chainIdHex, 16);
                setChainId(newChainId);
                // Reload to reset state
                window.location.reload();
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            return () => {
                window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum?.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, [provider]);

    // Connect wallet
    const connect = async () => {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask not installed');
            }

            setError(null);
            const browserProvider = new BrowserProvider(window.ethereum);

            // Request account access with better error handling
            await window.ethereum.request({ method: 'eth_requestAccounts' }).catch((err: any) => {
                if (err.code === 4001) {
                    throw new Error('Connection request rejected by user');
                } else if (err.code === -32002) {
                    throw new Error('Request already pending. Please check MetaMask.');
                }
                throw err;
            });

            const signer = await browserProvider.getSigner();
            const address = await signer.getAddress();
            const network = await browserProvider.getNetwork();
            const currentChainId = Number(network.chainId);

            setProvider(browserProvider);
            setSigner(signer);
            setAccount(address);
            setChainId(currentChainId);
            setIsConnected(true);

            // Create contract with signer
            const contractInstance = new Contract(RIDEBNB_ADDRESS, CONTRACT_ABI, signer);
            setContract(contractInstance);

            // Check if on correct network
            if (currentChainId !== CHAIN_ID) {
                await switchNetwork();
            }

            return address;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to connect wallet';
            setError(message);
            throw err;
        }
    };

    // Disconnect wallet
    const disconnect = () => {
        setSigner(null);
        setAccount(null);
        setIsConnected(false);

        // Revert to read-only contract
        if (provider) {
            const contractInstance = new Contract(RIDEBNB_ADDRESS, CONTRACT_ABI, provider);
            setContract(contractInstance);
        }
    };

    // Switch to opBNB network
    const switchNetwork = async () => {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask not installed');
            }

            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
            });
        } catch (error: any) {
            // Chain not added, add it
            if (error.code === 4902) {
                try {
                    await window.ethereum?.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: `0x${CHAIN_ID.toString(16)}`,
                                chainName: 'opBNB Testnet',
                                nativeCurrency: {
                                    name: 'BNB',
                                    symbol: 'BNB',
                                    decimals: 18,
                                },
                                rpcUrls: ['https://opbnb-testnet-rpc.bnbchain.org'],
                                blockExplorerUrls: ['https://opbnb-testnet.bscscan.com'],
                            },
                        ],
                    });
                } catch (addError) {
                    console.error('Failed to add network:', addError);
                    throw addError;
                }
            } else {
                throw error;
            }
        }
    };

    const isCorrectNetwork = chainId === CHAIN_ID;

    return {
        contract,
        royaltyContract,
        signer,
        provider,
        account,
        chainId,
        isConnected,
        isCorrectNetwork,
        error,
        connect,
        disconnect,
        switchNetwork,
    };
}
