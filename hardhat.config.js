import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

/** @type import('hardhat/config').HardhatUserConfig */
export default {
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
        opbnb: {
            url: process.env.OPBNB_RPC_URL || "https://opbnb-mainnet-rpc.bnbchain.org",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 204
        },
        opbnbTestnet: {
            url: process.env.OPBNB_TESTNET_RPC_URL || "https://opbnb-testnet-rpc.bnbchain.org",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 5611
        }
    },
    etherscan: {
        apiKey: {
            opbnb: process.env.BSCSCAN_API_KEY || "",
            opbnbTestnet: process.env.BSCSCAN_API_KEY || ""
        },
        customChains: [
            {
                network: "opbnb",
                chainId: 204,
                urls: {
                    apiURL: "https://api-opbnb.bscscan.com/api",
                    browserURL: "https://opbnb.bscscan.com"
                }
            },
            {
                network: "opbnbTestnet",
                chainId: 5611,
                urls: {
                    apiURL: "https://api-opbnb-testnet.bscscan.com/api",
                    browserURL: "https://opbnb-testnet.bscscan.com"
                }
            }
        ]
    }
};
