'use client';
import { useState, useEffect } from "react";
import { isAddress } from "ethers";
import { NETWORKS, COLORS, RequestStatus, getWatchAssetParams, SUPPORTED_CHAINS, getChainTokenSymbol } from "@/utils/constants";
import { hexToRgb } from "@/utils/helpers";
import Image from "next/image";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params: any }) => Promise<any>;
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
      isRabby?: boolean;
    };
  }
}

type Chain = 'base_sepolia' | 'arbitrum_sepolia' | 'optimism_sepolia';
type StatusType = 'success' | 'error' | 'cooldown' | 'info' | 'wallet-error';

interface TokenInfo {
  name: string;
  symbol: string;
  amount: string;
  color: string;
  icon: string;
  decimals: number;
  logoURI: string;
}



const TokenFaucet: React.FC = () => {
  const [address, setAddress] = useState<string>("");
  const [isValidAddress, setIsValidAddress] = useState<boolean>(false);
  const [isRequesting, setIsRequesting] = useState<Record<string, boolean>>({});
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [statusType, setStatusType] = useState<StatusType>('info');
  const [txHash, setTxHash] = useState<string>("");
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [addingToken, setAddingToken] = useState<RequestStatus>({});
  const [selectedChain, setSelectedChain] = useState<Chain>('base_sepolia');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {}, 1000);
    return () => clearTimeout(timer);
  }, []);



  // Available tokens (DAI and LINK only)
  const AVAILABLE_TOKENS: Record<string, TokenInfo> = {
    DAI: {
      name: "Dai Stablecoin",
      symbol: "DAI",
      amount: "10",
      color: "#F5AC37",
      icon: "💰",
      decimals: 18,
      logoURI: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.svg"
    },
    LINK: {
      name: "Chainlink Token",
      symbol: "LINK", 
      amount: "25",
      color: "#375BD2",
      icon: "🔗",
      decimals: 18,
      logoURI: "https://cryptologos.cc/logos/chainlink-link-logo.svg"
    }
  };



  const validateAddress = (addr: string): boolean => {
    try {
      const isValid = isAddress(addr);
      setIsValidAddress(isValid);
      return isValid;
    } catch (error) {
      setIsValidAddress(false);
      return false;
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputAddress = e.target.value.trim();
    setAddress(inputAddress);
    validateAddress(inputAddress);
  };

  const handleChainChange = (chain: Chain) => {
    setSelectedChain(chain);
    setStatusMessage("");
    setTxHash("");
    setActiveToken(null);
    setStatusType('info');
  };

  const requestTokens = async (tokenSymbol: string) => {
    if (!isValidAddress) {
      setStatusMessage("Please enter a valid Ethereum address");
      setStatusType('error');
      return;
    }
    
    const chainTokenSymbol = getChainTokenSymbol(tokenSymbol, selectedChain);
    setIsRequesting(prev => ({ ...prev, [tokenSymbol]: true }));
    setStatusMessage(`Requesting ${tokenSymbol} on ${SUPPORTED_CHAINS[selectedChain].name}...`);
    setStatusType('info');
    setTxHash("");
    setActiveToken(tokenSymbol);

    try {
      const response = await fetch("/api/request-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientAddress: address,
          tokenSymbol: chainTokenSymbol,
          chain: selectedChain
        }),
      });

      if (!response.ok) {
        let errorText;
        try {
          // First try to parse as JSON
          const errorData = await response.json();
          errorText = errorData.error ? errorData.error : JSON.stringify(errorData);
        } catch (e) {
          // If JSON parse fails, get text response
          errorText = await response.text();
        }
        throw new Error(errorText);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setTxHash(data.txHash || '');
      setStatusMessage(
        `✅ Success! Sent ${AVAILABLE_TOKENS[tokenSymbol].amount} ${tokenSymbol} to your address on ${SUPPORTED_CHAINS[selectedChain].name}!`
      );
      setStatusType('success');
    } catch (error: any) {
      console.error(`Error requesting ${tokenSymbol}:`, error);
      let errorMsg = error.message || 'Unknown error';
      
      // Handle cooldown specifically
      if (errorMsg.includes('minutes') || errorMsg.includes('minute') || 
          errorMsg.includes('hours') || errorMsg.includes('hour') || 
          errorMsg.includes('again') || errorMsg.includes('cooldown')) {
        setStatusMessage(`⏳ ${errorMsg}`);
        setStatusType('cooldown');
      } else {
        setStatusMessage(`❌ Failed to request ${tokenSymbol}. Error: ${errorMsg}`);
        setStatusType('error');
      }
    } finally {
      setIsRequesting(prev => ({ ...prev, [tokenSymbol]: false }));
    }
  };

  const getTokenAddress = (tokenSymbol: string, chain: Chain): string => {
    const tokenAddresses: Record<Chain, Record<string, string>> = {
      'base_sepolia': {
        'DAI': '0xFEa8109D6955c4F3F7930ad57B5798606264BDB0',
        'LINK': '0x46d4AafcEd9cc65089D1606e6cAE85fe6D7df456' 
      },
      'arbitrum_sepolia': {
        'DAI': '0x6bc614678F6B64Fa7F4530C66E03F3DaB8C236a6', 
        'LINK': '0x23eb68D3C0472f6892c2d68B0F2A8F0f5282a7ED'
      },
      'optimism_sepolia': {
        'DAI': '0x3fE4a6f534aCB3f1fEaf6C7Bc3810cB7eC9136aE', 
        'LINK': '0xB68D6a420f60FAa64bFE165a3ce9313E734eFD34' 
      }
    };
    return tokenAddresses[chain]?.[tokenSymbol] || '';
  };

  const addTokenToWallet = async (tokenSymbol: string) => {
    if (!mounted) {
      setStatusMessage("Please wait for the application to load.");
      setStatusType('info');
      return;
    }
  
    if (!window.ethereum) {
      setStatusMessage("No Web3 wallet detected. Please install MetaMask or another Web3 wallet.");
      setStatusType('wallet-error');
      return;
    }
  
    setAddingToken(prev => ({ ...prev, [tokenSymbol]: true }));
    setStatusMessage(`Adding ${tokenSymbol} to wallet...`);
    setStatusType('info');
  
    try {
      const tokenAddress = getTokenAddress(tokenSymbol, selectedChain);
      if (!tokenAddress) {
        throw new Error(`Token address not found for ${tokenSymbol} on ${selectedChain}`);
      }
  
      const tokenMetadata = tokenSymbol === 'DAI' 
        ? { symbol: 'DAI', name: 'DAI', decimals: 18 } 
        : { symbol: 'LINK', name: 'LINK', decimals: 18 };
  
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenMetadata.symbol,
            decimals: tokenMetadata.decimals,
            name: tokenMetadata.name,
          },
        },
      });
  
      if (wasAdded) {
        setStatusMessage(`✅ ${tokenSymbol} was successfully added to your wallet!`);
        setStatusType('success');
      } else {
        setStatusMessage(`ℹ️ ${tokenSymbol} addition was cancelled.`);
        setStatusType('info');
      }
    } catch (error: any) {
      console.error(`Error adding ${tokenSymbol} to wallet:`, error);
      const errorMessage = error?.message || 'Unknown error occurred';
      
      if (error?.code === 4001) {
        setStatusMessage(`ℹ️ ${tokenSymbol} addition was cancelled by user.`);
        setStatusType('info');
        return;
      }
      
      setStatusMessage(`⚠️ Error adding ${tokenSymbol}: ${errorMessage}`);
      setStatusType('wallet-error');
    } finally {
      setAddingToken(prev => ({ ...prev, [tokenSymbol]: false }));
    }
  };

  const redirectToCircle = () => {
    if (mounted && typeof window !== 'undefined') {
      window.open('https://faucet.circle.com/', '_blank');
    }
  };

  // Status message styling helper
  const getStatusStyle = () => {
    switch (statusType) {
      case 'success':
        return { 
          borderColor: COLORS.baseGreen,
          textColor: COLORS.baseGreen
        };
      case 'cooldown':
        return { 
          borderColor: COLORS.solarOrange,
          textColor: COLORS.solarOrange
        };
      case 'error':
        return { 
          borderColor: '#EF4444',
          textColor: '#EF4444'
        };
      case 'wallet-error':
        return { 
          borderColor: '#3B82F6',
          textColor: '#3B82F6'
        };
      default: // info
        return { 
          borderColor: 'rgba(255, 255, 255, 0.1)',
          textColor: COLORS.lightText
        };
    }
  };

  const statusStyle = getStatusStyle();

  if (!mounted) {
    return (
      <div className="w-full max-w-xl mx-auto" style={{ fontFamily: '"Inter", sans-serif' }}>
        <div
          className="rounded-2xl shadow-lg overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${COLORS.midnightBlue} 0%, ${COLORS.darkBackground} 100%)`,
            border: `1px solid rgba(255, 255, 255, 0.05)`
          }}
        >
          <div className="p-8 text-center">
            <h1 className="text-3xl font-bold" style={{ color: COLORS.lightText }}>
              Loading...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto" style={{ fontFamily: '"Inter", sans-serif' }}>
      <div
        className="rounded-2xl shadow-lg overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${COLORS.midnightBlue} 0%, ${COLORS.darkBackground} 100%)`,
            border: `1px solid rgba(255, 255, 255, 0.05)`
        }}
      >
        {/* Header Section */}
        <div className="p-8 text-center relative">
          <div className="absolute top-6 left-6">
            <div className="w-12 h-12">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg" style={{ backgroundColor: COLORS.darkBackground }}>
                <div style={{ color: COLORS.baseGreen, fontSize: '24px' }}>
                  <Image src="/icon.svg" alt="LendBit Logo" width={24} height={24} />
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold" style={{ color: COLORS.lightText }}>
            LendBit Faucet
          </h1>
          <p className="mt-2 text-sm opacity-70" style={{ color: COLORS.lightText }}>
            Get testnet tokens across multiple chains
          </p>

          {/* Glowing divider */}
          <div className="mt-6 h-px w-full max-w-sm mx-auto opacity-20" style={{
            background: `linear-gradient(90deg, transparent, ${COLORS.baseGreen}, transparent)`
          }}></div>
        </div>

        {/* Content Section */}
        <div className="p-8 pt-2">
          {/* Chain Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3" style={{ color: COLORS.lightText }}>
              Select Chain
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(SUPPORTED_CHAINS).map(([chainKey, chainInfo]) => (
                <button
                  key={chainKey}
                  onClick={() => handleChainChange(chainKey as Chain)}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${
                    selectedChain === chainKey ? 'ring-2' : ''
                  }`}
                  style={{
                    backgroundColor: selectedChain === chainKey 
                      ? `rgba(${hexToRgb(chainInfo.color)}, 0.15)` 
                      : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${selectedChain === chainKey ? chainInfo.color : 'rgba(255, 255, 255, 0.05)'}`
                    // ringColor: chainInfo.color
                  }}
                >
                  <span className="text-xl mb-1">{chainInfo.icon}</span>
                  <span className="text-xs font-medium" style={{ color: COLORS.lightText }}>
                    {chainInfo.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Address Input */}
          <div className="mb-8">
            <label htmlFor="address" className="block text-sm font-medium mb-2" style={{ color: COLORS.lightText }}>
              Your Wallet Address
            </label>
            <div className={`flex items-center p-4 rounded-xl transition-all duration-200 ${
              address ? (isValidAddress ? 'border-green-500' : 'border-red-500') : 'border-gray-700'
            }`} style={{
              backgroundColor: COLORS.midnightBlue,
              border: `1px solid ${address ? (isValidAddress ? COLORS.baseGreen : COLORS.solarOrange) : 'rgba(255, 255, 255, 0.1)'}`
            }}>
              <input
                type="text"
                id="address"
                placeholder="0x..."
                value={address}
                onChange={handleAddressChange}
                className="w-full bg-transparent outline-none text-white"
                style={{ color: COLORS.lightText }}
              />
              {address && (
                <div className="ml-2">
                  {isValidAddress ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                        stroke={COLORS.baseGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 9L9 15M9 9L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                        stroke={COLORS.solarOrange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              )}
            </div>
            {address && !isValidAddress && (
              <p className="mt-2 text-sm" style={{ color: COLORS.solarOrange }}>
                Please enter a valid Ethereum address
              </p>
            )}
          </div>

          {/* Token Selection Cards */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            {Object.entries(AVAILABLE_TOKENS).map(([symbol, details]) => (
              <div
                key={symbol}
                className={`group relative flex items-center justify-between p-5 rounded-xl transition-all duration-200 overflow-hidden ${
                  isValidAddress && !isRequesting[symbol] ? "cursor-pointer" : "cursor-not-allowed"
                }`}
                style={{
                  backgroundColor: activeToken === symbol 
                    ? `rgba(${hexToRgb(details.color)}, 0.15)` 
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${activeToken === symbol ? details.color : 'rgba(255, 255, 255, 0.05)'}`,
                  opacity: !isValidAddress || isRequesting[symbol] ? 0.5 : 1,
                }}
                onClick={() => {
                  if (isValidAddress && !isRequesting[symbol]) {
                    requestTokens(symbol);
                  }
                }}
              >
                {/* Background hover effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none"
                  style={{ background: details.color }}
                ></div>

                <div className="flex items-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg mr-4"
                    style={{
                      backgroundColor: `rgba(${hexToRgb(details.color)}, 0.15)`,
                      color: details.color
                    }}
                  >
                    <span className="text-xl">{details.icon}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-lg" style={{ color: COLORS.lightText }}>
                      {details.symbol}
                    </p>
                    <p className="text-sm opacity-70" style={{ color: COLORS.lightText }}>
                      {details.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      requestTokens(symbol);
                    }}
                    disabled={!isValidAddress || isRequesting[symbol]}
                    className="py-2 px-4 rounded-lg font-medium text-sm"
                    style={{
                      backgroundColor: `rgba(${hexToRgb(details.color)}, 0.15)`,
                      color: details.color,
                      cursor: !isValidAddress || isRequesting[symbol] ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isRequesting[symbol] ? "Requesting..." : `Get ${details.amount}`}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addTokenToWallet(symbol);
                    }}
                    disabled={addingToken[symbol]}
                    className="p-2.5 rounded-lg transition-all duration-200 flex-shrink-0"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: COLORS.lightText
                    }}
                    title={`Add ${symbol} to wallet`}
                  >
                    {addingToken[symbol] ? (
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeDashoffset="0" />
                        <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 8.5L19 5.5C19 4.39543 18.1046 3.5 17 3.5L7 3.5C5.89543 3.5 5 4.39543 5 5.5L5 18.5C5 19.6046 5.89543 20.5 7 20.5L17 20.5C18.1046 20.5 19 19.6046 19 18.5L19 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M12 8.5V16.5M16 12.5H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* USDC Redirect Card */}
          <div
            className="group relative flex items-center justify-between p-5 rounded-xl transition-all duration-200 overflow-hidden cursor-pointer mb-8"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
            onClick={redirectToCircle}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200"
              style={{ background: '#2775CA' }}
            ></div>

            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg mr-4"
                style={{
                  backgroundColor: 'rgba(39, 117, 202, 0.15)',
                  color: '#2775CA'
                }}
              >
                <span className="text-xl">💵</span>
              </div>
              <div className="text-left">
                <p className="font-medium text-lg" style={{ color: COLORS.lightText }}>
                  USDC
                </p>
                <p className="text-sm opacity-70" style={{ color: COLORS.lightText }}>
                  Get USDC from Circle Faucet
                </p>
              </div>
            </div>

            <button
              className="py-2 px-4 rounded-lg font-medium text-sm flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(39, 117, 202, 0.15)',
                color: '#2775CA'
              }}
            >
              Visit Circle
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Status Messages */}
          {statusMessage && (
            <div
              className="mt-4 p-5 rounded-xl text-center"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${statusStyle.borderColor}`,
                color: statusStyle.textColor
              }}
            >
              <p className="text-sm">
                {statusMessage}
              </p>
              {txHash && (
                <div className="mt-3">
                  <a
                    href={`${NETWORKS[selectedChain]?.blockExplorer}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: `rgba(${hexToRgb(COLORS.baseGreen)}, 0.15)`,
                      color: COLORS.baseGreen,
                      border: `1px solid rgba(${hexToRgb(COLORS.baseGreen)}, 0.3)`
                    }}
                  >
                    View transaction
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Network Info */}
          <div className="mt-8 text-center">
            <p className="text-sm opacity-50" style={{ color: COLORS.lightText }}>
              Current: {SUPPORTED_CHAINS[selectedChain].name} • Please use responsibly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenFaucet;