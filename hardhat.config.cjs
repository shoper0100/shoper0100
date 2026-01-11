require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            },
            viaIR: true
        }
    },
    networks: {
        bsc: {
            url: process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org",
            chainId: 56,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 100000000, // 0.1 gwei (VERY LOW - may take long time!)
            timeout: 600000, // 10 minutes timeout
        },
        opbnb: {
            url: process.env.OPBNB_RPC_URL || "https://opbnb-mainnet-rpc.bnbchain.org",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 204
        },
        opbnbTestnet: {
            url: process.env.OPBNB_TESTNET_RPC_URL || "https://opbnb-testnet-rpc.bnbchain.org",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 5611
        },
        bscTestnet: {
            url: process.env.BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 97,
            gasPrice: 100000000  // 0.1 Gwei
        }
    },
    etherscan: {
        apiKey: "6RDAKJA74DPRFCMA4Z2FUDM9TVQ7M88KT1",
        customChains: [
            {
                network: "opbnb",
                chainId: 204,
                urls: {
                    apiURL: "https://api-opbnb.bscscan.com/api",
                    browserURL: "https://opbnbscan.com"
                }
            },
            {
                network: "opbnbTestnet",
                chainId: 5611,
                urls: {
                    apiURL: "https://api-opbnb-testnet.bscscan.com/api",
                    browserURL: "https://testnet.opbnbscan.com"
                }
            },
            {
                network: "bscTestnet",
                chainId: 97,
                urls: {
                    apiURL: "https://api-testnet.bscscan.com/api",
                    browserURL: "https://testnet.bscscan.com"
                }
            }
        ]
    },
    sourcify: {
        enabled: false
    }
};
