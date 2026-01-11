export interface User {
    id: bigint;
    account: string;
    referrer: bigint;
    upline: bigint;
    start: bigint;
    level: bigint;
    directTeam: bigint;
    totalMatrixTeam: bigint;
    totalIncome: bigint;
    totalDeposit: bigint;
    royaltyIncome: bigint;
    referralIncome: bigint;
    levelIncome: bigint;
    sponsorIncome: bigint;
    exists: boolean;
}

export interface UserIncome {
    totalIncome: bigint;
    totalDeposit: bigint;
    royaltyIncome: bigint;
    referralIncome: bigint;
    levelIncome: bigint;
    sponsorIncome: bigint;
}


export interface Income {
    id: bigint;
    layer: bigint;
    amount: bigint;
    time: bigint;
    isLost: boolean;
    transactionHash?: string;
}

export interface Activity {
    id: bigint;
    level: bigint;
}

export interface RoyaltyInfo {
    tier: number;
    level: number;
    percentage: number;
    totalPool: bigint;
    userShare: bigint;
    eligibleUsers: bigint;
    canClaim: boolean;
    hasClaimed: boolean;
}

export interface MatrixNode {
    userId: bigint;
    user: User;
    children: MatrixNode[];
    level: number;
}

export interface TeamMember {
    account: string;
    id: bigint;
    referrer: bigint;
    upline: bigint;
    start: bigint;
    level: bigint;
    directTeam: bigint;
    totalMatrixTeam: bigint;
    exists: boolean;
    isDirectReferral: boolean;
    joinedAt: Date;
}

export interface DashboardStats {
    totalUsers: bigint;
    totalIncome: bigint;
    activeRoyaltyTier: number | null;
    directReferrals: bigint;
    teamSize: bigint;
    currentLevel: bigint;
}
