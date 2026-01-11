import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatEther, parseEther } from 'ethers';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format wei to BNB with specified decimals
 */
export function formatBNB(wei: bigint | string | null | undefined, decimals: number = 4): string {
    if (wei === null || wei === undefined) {
        return '0.0000';
    }

    try {
        const value = typeof wei === 'string' ? BigInt(wei) : wei;
        const bnb = formatEther(value);
        return parseFloat(bnb).toFixed(decimals);
    } catch (err) {
        console.error('Error formatting BNB:', err);
        return '0.0000';
    }
}

/**
 * Parse BNB to wei
 */
export function parseBNB(bnb: string): bigint {
    return parseEther(bnb);
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: bigint | number): string {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format large numbers with suffix (K, M, B)
 */
export function formatNumber(num: bigint | number): string {
    const value = typeof num === 'bigint' ? Number(num) : num;

    if (value >= 1000000000) {
        return (value / 1000000000).toFixed(2) + 'B';
    }
    if (value >= 1000000) {
        return (value / 1000000).toFixed(2) + 'M';
    }
    if (value >= 1000) {
        return (value / 1000).toFixed(2) + 'K';
    }
    return value.toString();
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Calculate total cost with fee
 */
export function calculateTotalCost(baseAmount: bigint, feePercent: number): bigint {
    const fee = (baseAmount * BigInt(feePercent)) / BigInt(100);
    return baseAmount + fee;
}

/**
 * Check if user is qualified for income (level >= required level and direct team >= 2)
 */
export function isQualified(userLevel: bigint, requiredLevel: bigint, directTeam: bigint): boolean {
    return userLevel > requiredLevel && directTeam >= BigInt(2);
}

/**
 * Get royalty tier from level
 */
export function getRoyaltyTier(level: bigint): number | null {
    const lvl = Number(level);
    if (lvl === 10) return 0;
    if (lvl === 11) return 1;
    if (lvl === 12) return 2;
    if (lvl === 13) return 3;
    return null;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get explorer link for transaction or address
 */
export function getExplorerLink(hash: string, type: 'tx' | 'address' = 'tx'): string {
    const explorerUrl = 'https://opbnb.bscscan.com';
    return `${explorerUrl}/${type}/${hash}`;
}
