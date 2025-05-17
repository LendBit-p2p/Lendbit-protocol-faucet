import { Contract, ethers } from "ethers";
import { NETWORK } from "./constants";

// Simple ABI for faucet contract
export const faucetABI = [
  "function requestTokens(address recipient, string tokenSymbol) external",
  "function timeUntilNextRequest(address user, string tokenSymbol) external view returns (uint256)",
  "function canRequestToken(address user, string tokenSymbol) external view returns (bool)",
];

export async function getProvider(): Promise<ethers.JsonRpcProvider> {
  return await new ethers.JsonRpcProvider(NETWORK.rpcUrl, {
    name: NETWORK.name,
    chainId: NETWORK.chainId as number,
  });
}

export async function getFaucetContract(privateKey: string): Promise<Contract> {
  const provider = await getProvider();

  const wallet = new ethers.Wallet(privateKey, provider);

  return new ethers.Contract(
    process.env.FAUCET_ADDRESS as string,
    faucetABI,
    wallet
  );
}
