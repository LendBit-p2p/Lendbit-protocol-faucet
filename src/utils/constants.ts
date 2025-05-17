export const FAUCET_ADDRESS = process.env.NEXT_PUBLIC_FAUCET_ADDRESS;

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

export const TOKENS: Record<string, TokenInfo> = {
  WETH: {
    name: "Wrapped Ether",
    amount: "0.1",
    color: "bg-yellow-500 hover:bg-yellow-600",
    icon: "♦",
    symbol: "WETH",
    address: "0xAB6015514c40F5B0bb583f28c0819cA79e3B9415",
    decimals: 18,
    logoURI: "https://five-protocol-faucet.vercel.app/tokens/ETH.svg",
  },
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
  USDT: {
    name: "USD Tether",
    amount: "100",
    color: "bg-blue-500 hover:bg-blue-600",
    icon: "💵",
    symbol: "USDT",
    address: "0x00D1C02E008D594ebEFe3F3b7fd175850f96AEa0",
    decimals: 6,
    logoURI: "https://five-protocol-faucet.vercel.app/tokens/USDT.svg",
  },
  DAI: {
    name: "Dai Stablecoin",
    amount: "100",
    color: "bg-yellow-400 hover:bg-yellow-500",
    icon: "💱",
    symbol: "DAI",
    address: "0xb0dbA4BDEC9334f4E9663e9b9941E37018BbE81a",
    decimals: 18,
    logoURI: "https://five-protocol-faucet.vercel.app/tokens/DAI.svg",
  },
};

export const NETWORK = {
  name: "Base Sepolia",
  chainId: 84532,
  rpcUrl: "https://sepolia.base.org",
  blockExplorer: "https://base-sepolia.blockscout.com/",
  blockExplorerName: "BaseScan",
};

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
