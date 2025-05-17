'use client';
import { useState } from "react";
import { isAddress } from "ethers";
import { TOKENS, NETWORK, COLORS, RequestStatus, getWatchAssetParams } from "@/utils/constants";
import { hexToRgb } from "@/utils/helpers";
import Image from "next/image";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params: any }) => Promise<any>;
    };
  }
}

const TokenFaucet: React.FC = () => {
  const [address, setAddress] = useState<string>("");
  const [isValidAddress, setIsValidAddress] = useState<boolean>(false);
  const [isRequesting, setIsRequesting] = useState<Record<string, boolean>>({});
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [addingToken, setAddingToken] = useState<RequestStatus>({});

  // Validate Ethereum address
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

  const requestTokens = async (tokenSymbol: string) => {
    if (!isValidAddress) {
      setStatusMessage("Please enter a valid Ethereum address");
      return;
    }

    setIsRequesting({ ...isRequesting, [tokenSymbol]: true });
    setStatusMessage(`Requesting ${tokenSymbol}...`);
    setTxHash("");
    setActiveToken(tokenSymbol);
    try {
      // Call our Next.js API route
      const response = await fetch("/api/request-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientAddress: address,
          tokenSymbol,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request tokens");
      }

      setTxHash(data.txHash);
      setStatusMessage(
        `Successfully sent ${TOKENS[tokenSymbol].amount} ${tokenSymbol} to your address!`
      );
    } catch (error: any) {
      console.error(`Error requesting ${tokenSymbol}:`, error);
      setStatusMessage(`Failed to request ${tokenSymbol}. ${error.message}`);
    } finally {
      setIsRequesting({ ...isRequesting, [tokenSymbol]: false });
    }
  };

  const addTokenToWallet = async (tokenSymbol: string) => {
    console.log(`Clicking`, tokenSymbol)
    if (!window.ethereum) {
      setStatusMessage("No Web3 wallet detected. Please install MetaMask.");
      return;
    }

    setAddingToken({ ...addingToken, [tokenSymbol]: true });

    try {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: getWatchAssetParams(tokenSymbol),
      });

      if (wasAdded) {
        setStatusMessage(`${tokenSymbol} was successfully added to your wallet`);
      } else {
        setStatusMessage(`Failed to add ${tokenSymbol} to your wallet`);
      }
    } catch (error: any) {
      console.error(`Error adding ${tokenSymbol} to wallet:`, error);
      setStatusMessage(`Error adding ${tokenSymbol} to wallet: ${error.message}`);
    } finally {
      setAddingToken({ ...addingToken, [tokenSymbol]: false });
    }
  };

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
              {/* Replace with your actual logo component or Image */}
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
            Get testnet tokens for {NETWORK.name}
          </p>

          {/* Glowing divider */}
          <div className="mt-6 h-px w-full max-w-sm mx-auto opacity-20" style={{
            background: `linear-gradient(90deg, transparent, ${COLORS.baseGreen}, transparent)`
          }}></div>
        </div>

        {/* Content Section */}
        <div className="p-8 pt-2">
          {/* Address Input */}
          <div className="mb-8">
            <label htmlFor="address" className="block text-sm font-medium mb-2" style={{ color: COLORS.lightText }}>
              Your Wallet Address
            </label>
            <div className={`flex items-center p-4 rounded-xl transition-all duration-200 ${address ? (isValidAddress ? 'border-green-500' : 'border-red-500') : 'border-gray-700'
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
          <div className="grid grid-cols-1 gap-4 mb-8">
            {Object.entries(TOKENS).map(([symbol, details]) => (
              <div
                key={symbol}
                className={`group relative flex items-center justify-between p-5 rounded-xl transition-all duration-200 overflow-hidden ${isValidAddress ? "cursor-pointer" : "cursor-not-allowed"}`}
                style={{
                  backgroundColor: activeToken === symbol ? `rgba(${hexToRgb(details.color)}, 0.15)` : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${activeToken === symbol ? details.color : 'rgba(255, 255, 255, 0.05)'}`,
                  opacity: !isValidAddress || isRequesting[symbol] ? 0.5 : 1,
                }}
                onClick={() => {
                  if (isValidAddress) {
                    requestTokens(symbol);
                  }
                }}
              >
                {/* Background hover effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200"
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

                <button
                  onClick={() => requestTokens(symbol)}
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

                <div className="flex items-center">
                  <button
                    onClick={() => addTokenToWallet(symbol)}
                    disabled={addingToken[symbol]}
                    className="p-2.5 rounded-lg transition-all duration-200 flex-shrink-0 z-10"
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

          {/* Status Messages */}
          {statusMessage && (
            <div
              className="mt-4 p-5 rounded-xl text-center"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid rgba(255, 255, 255, 0.05)`
              }}
            >
              <p className="text-sm" style={{ color: COLORS.lightText }}>
                {statusMessage}
              </p>
              {txHash && (
                <div className="mt-3">
                  <a
                    href={`${NETWORK.blockExplorer}/tx/${txHash}`}
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
              Testnet: {NETWORK.name} • Please use responsibly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenFaucet;
