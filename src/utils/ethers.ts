import { Contract, ethers } from "ethers";

import { NETWORKS, Chain } from "./constants";

// Faucet contract ABI
export const faucetABI = [
  "function requestTokens(address recipient, string tokenSymbol) external",
  "function timeUntilNextRequest(address user, string tokenSymbol) external view returns (uint256)",
  "function canRequestToken(address user, string tokenSymbol) external view returns (bool)",
];

export async function getProvider(chain: Chain): Promise<ethers.JsonRpcProvider> {
  const network = NETWORKS[chain];
  if (!network.rpcUrl) {
    throw new Error(`RPC URL not configured for ${chain}`);
  }
  return new ethers.JsonRpcProvider(network.rpcUrl, {
    name: network.name,
    chainId: network.chainId,
  });
}

export async function getFaucetContract(chain: Chain): Promise<Contract> {
  const provider = await getProvider(chain);
  const network = NETWORKS[chain];

  if (!network.faucetAddress) {
    throw new Error(`Faucet address not configured for ${chain}`);
  }

  const privateKey = process.env.NEXT_PUBLIC_FAUCET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Faucet private key not configured");
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(network.faucetAddress, faucetABI, wallet);

}