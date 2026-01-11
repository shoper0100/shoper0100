import { ethers } from "ethers";
import fs from "fs";

// CONFIGURATION
const RPC_URL = "https://bsc-dataseed.binance.org/"; // Replace with Testnet if needed: https://data-seed-prebsc-1-s1.binance.org:8545/
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE"; // <--- USER MUST SET THIS
const START_BLOCK = 0; // Replace with deployment block to save time

// ABI (Only Events)
const ABI = [
    "event UserRegistered(uint indexed userId, address indexed account, uint indexed referrer, uint timestamp)",
    "event UserUpgraded(uint indexed userId, uint newLevel, uint amount, uint timestamp)",
    "event ReferralPayment(uint indexed referrerId, uint indexed userId, uint amount, uint timestamp)",
    "event MatrixPayment(uint indexed fromUserId, uint indexed toUserId, uint amount, uint level, uint layer, bool qualified, uint timestamp)",
    "event SponsorCommissionPaid(uint indexed sponsorId, uint indexed fromUserId, uint amount, uint level, uint timestamp)",
    "event RoyaltyPoolFunded(uint indexed userId, uint amount, uint timestamp)",
    "event RoyaltyClaimed(uint indexed userId, uint indexed royaltyLevel, uint amount, uint timestamp)",
    "event AdminFeePaid(uint amount, uint level, uint timestamp)",
    "event IncomeLost(uint indexed userId, uint indexed fromUser, uint amount, string reason, uint timestamp)",
    "event RootFallbackIncome(uint amount, string source, uint timestamp)",
    "event BNBPriceUpdated(uint oldPrice, uint newPrice, uint timestamp)"
];

async function main() {
    console.log("Starting Event Scraper...");
    console.log(`Connecting to RPC: ${RPC_URL}`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    console.log(`Querying events for contract: ${CONTRACT_ADDRESS}`);

    // Fetch all events
    // Note: On public RPCs, you might need to chunk this loop. 
    // This script assumes a manageable range or an archive node.

    try {
        const events = await contract.queryFilter("*", START_BLOCK, "latest");
        console.log(`Found ${events.length} events.`);

        // Prepare CSV Data
        const csvRows = [];
        // Header
        csvRows.push("EventName,BlockNumber,TransactionHash,Date,Arg1,Arg2,Arg3,Arg4,Arg5");

        for (const event of events) {
            const block = await event.getBlock();
            const date = new Date(block.timestamp * 1000).toISOString();

            // Format Args
            // We'll just join the args array for simplicity in the CSV
            // ethers v6 returns a Result object which is array-like
            const args = Array.from(event.args).map(arg => {
                if (typeof arg === 'bigint') return arg.toString();
                return arg;
            });

            const row = [
                event.eventName,
                event.blockNumber,
                event.transactionHash,
                date,
                ...args // Spreads args into columns Arg1, Arg2, etc.
            ].join(",");

            csvRows.push(row);
        }

        // Write to File
        const filename = "events_export.csv";
        fs.writeFileSync(filename, csvRows.join("\n"));
        console.log(`Successfully saved events to ${filename}`);

    } catch (error) {
        console.error("Error fetching events:", error);
        console.log("\nTIP: If you get a 'Log verification failed' or 'limit exceeded', try reducing the block range.");
    }
}

main();
