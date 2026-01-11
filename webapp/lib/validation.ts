import { ethers } from 'ethers';

/**
 * Validation utilities for secure input handling
 */

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

/**
 * Validate and parse a number safely
 */
export const validateNumber = (value: any, name: string, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number => {
    const num = Number(value);
    if (isNaN(num)) {
        throw new ValidationError(`${name} must be a valid number`);
    }
    if (num < min) {
        throw new ValidationError(`${name} must be at least ${min}`);
    }
    if (num > max) {
        throw new ValidationError(`${name} must be at most ${max}`);
    }
    return num;
};

/**
 * Validate Ethereum address
 */
export const validateAddress = (address: string, name: string = 'Address'): string => {
    if (!address || typeof address !== 'string') {
        throw new ValidationError(`${name} is required`);
    }
    if (!ethers.isAddress(address)) {
        throw new ValidationError(`${name} is not a valid Ethereum address`);
    }
    return ethers.getAddress(address); // Return checksummed address
};

/**
 * Validate user ID
 */
export const validateUserId = (id: any): number => {
    return validateNumber(id, 'User ID', 1, 1000000);
};

/**
 * Validate referral ID (can be 0 for root)
 */
export const validateReferralId = (id: any): number => {
    return validateNumber(id, 'Referral ID', 0, 1000000);
};

/**
 * Safely parse BNB amount with precision
 */
export const parseBNBAmount = (usdAmount: number, bnbPriceUsd: number): string => {
    if (bnbPriceUsd <= 0) {
        throw new ValidationError('BNB price must be greater than 0');
    }
    const bnbAmount = usdAmount / bnbPriceUsd;
    return bnbAmount.toFixed(18); // 18 decimal precision
};

/**
 * Validate BNB price
 */
export const validateBNBPrice = (price: any): number => {
    return validateNumber(price, 'BNB Price', 1, 100000);
};

/**
 * Sanitize URL parameter
 */
export const sanitizeParam = (param: string | null): string => {
    if (!param) return '';
    // Remove any potentially harmful characters
    return param.replace(/[<>\"']/g, '');
};

/**
 * Validate transaction hash
 */
export const validateTxHash = (hash: string): boolean => {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
};
