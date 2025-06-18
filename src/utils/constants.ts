import { sep } from "path";

export const FAUCET_ADDRESS = process.env.NEXT_PUBLIC_FAUCET_ADDRESS;


interface ChainInfo {
  name: string;
  icon: string;
  color: string;
}


export interface TokenInfo {
  name: string;
  amount: string;
  color: string;
  icon: string;
  symbol: string;
  address: string;
  decimals: number;
  logoURI: string;
}

export interface RequestStatus {
  [key: string]: boolean;
}

export const COLORS = {
  baseGreen: "#00D395",
  midnightBlue: "#12151A",
  coolGray: "#B0BEC5",
  neonCyan: "#00F5FF",
  electricPurple: "#A66CFF",
  solarOrange: "#FF8C42",
  darkBackground: "#0A0B0D",
  lightText: "#FFFFFF",
  lightGray: "#F7F9FA",
};




  export const getChainTokenSymbol = (tokenSymbol: string, chain: Chain): string => {
    const tokenMap: Record<Chain, Record<string, string>> = {
      'base_sepolia': {
        'DAI': 'ETH_DAI',
        'LINK': 'ETH_LINK'
      },
      'arbitrum_sepolia': {
        'DAI': 'ARB_DAI', 
        'LINK': 'ARB_LINK'
      },
      'optimism_sepolia': {
        'DAI': 'OP_DAI',
        'LINK': 'OP_LINK'
      }
    };
    return tokenMap[chain]?.[tokenSymbol] || `${chain.toUpperCase().split('_')[0]}_${tokenSymbol}`;
  };

export const TOKENS: Record<string, TokenInfo> = {


  LINK: {
    name: "Chainlink",
    amount: "25",
    color: "bg-blue-400 hover:bg-blue-500",
    icon: "🔗",
    symbol: "LINK",
    address: "0x9b76e44C8d3a625D0d5e9a04227dc878B31897C2",
    decimals: 18,
    logoURI: "https://five-protocol-faucet.vercel.app/tokens/LINK.svg",
  },
  DAI: {
    name: "Dai Stablecoin",
    amount: "10",
    color: "bg-yellow-400 hover:bg-yellow-500",
    icon: "💱",
    symbol: "DAI",
    address: "0xb0dbA4BDEC9334f4E9663e9b9941E37018BbE81a",
    decimals: 18,
    logoURI: "https://five-protocol-faucet.vercel.app/tokens/DAI.svg",
  },
};

 // Supported chains
 export const SUPPORTED_CHAINS: Record<Chain, ChainInfo> = {
  'base_sepolia': {
    name: 'Base Sepolia',
    icon: '🔵',
    color: '#0052FF'
  },
  'arbitrum_sepolia': {
    name: 'Arbitrum Sepolia', 
    icon: '🔶',
    color: '#12AAFF'
  },
  'optimism_sepolia': {
    name: 'Optimism Sepolia',
    icon: '🔴', 
    color: '#FF0420'
  }
};


// utils/constants.ts

export const NETWORKS = {

  base_sepolia: {
    name: "Base Sepolia",
    chainId: Number(process.env.NEXT_PUBLIC_BASE_CHAIN_ID),
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL as string,
    blockExplorer: "https://base-sepolia.blockscout.com/",
    faucetAddress: process.env.NEXT_PUBLIC_BASE_FAUCET_ADDRESS,
    blockExplorerName: "BaseScan",
  },

  arbitrum_sepolia: {
    name: "Arbitrum Sepolia",
    chainId: Number(process.env.NEXT_PUBLIC_ARBITRUM_CHAIN_ID),
    rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL as string,
    blockExplorer: "https://sepolia-explorer.arbitrum.io/",
    faucetAddress: process.env.NEXT_PUBLIC_ARBITRUM_FAUCET_ADDRESS,
    blockExplorerName: "Arbiscan",
  },
  
  optimism_sepolia: {
    name: "Optimism Sepolia",
    chainId: Number(process.env.NEXT_PUBLIC_OPTIMISM_CHAIN_ID),
    rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL as string,
    blockExplorer: "https://sepolia-optimistic.etherscan.io/",
    faucetAddress: process.env.NEXT_PUBLIC_OPTIMISM_FAUCET_ADDRESS,
    blockExplorerName: "Optimism Explorer",
  },
};

export type Chain = keyof typeof NETWORKS;


export function getWatchAssetParams(tokenSymbol: string) {
  const token = TOKENS[tokenSymbol];

  return {
    type: "ERC20",
    options: {
      address: token.address,
      symbol: token.symbol,
      decimals: token.decimals,
      image: token.logoURI,
    },
  };
}
