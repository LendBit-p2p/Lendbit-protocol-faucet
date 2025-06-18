// app/api/faucet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFaucetContract } from "../../../utils/ethers";
import { Chain, NETWORKS,  } from "@/utils/constants";
import { isAddress } from "ethers";

// Define the request body type
interface RequestBody {
  recipientAddress: string;
  tokenSymbol: string;
  chain: Chain;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { recipientAddress, tokenSymbol, chain } = body;

    // Basic validation
    if (!recipientAddress || !tokenSymbol || !chain) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Validate chain
    if (!NETWORKS[chain]) {
      return NextResponse.json(
        { error: `Unsupported chain: ${chain}` },
        { status: 400 }
      );
    }

    // Validate address format
    if (!isAddress(recipientAddress)) {
      return NextResponse.json(
        { error: "Invalid recipient address" },
        { status: 400 }
      );
    }

    // Get faucet contract for the selected chain
    const faucetContract = await getFaucetContract(chain);

    // Check if user can request tokens (not in cooldown)
    try {
      const canRequest = await faucetContract.canRequestToken(
        recipientAddress,
        tokenSymbol
      );

      console.log("canRequestToken result:", canRequest);
      if (!canRequest) {
        const waitTime = await faucetContract.timeUntilNextRequest(
          recipientAddress,
          tokenSymbol
        );
        const waitMinutes = Math.ceil(Number(waitTime) / 60);
        return NextResponse.json(
          {
            error: `Please wait approximately ${waitMinutes} minutes before requesting ${tokenSymbol} again on ${NETWORKS[chain].name}.`,
          },
          { status: 429 }
        );
      }
    } catch (error) {
      console.error("Error checking request eligibility:", error);
      return NextResponse.json(
        { error: "Failed to check request eligibility" },
        { status: 500 }
      );
    }

    // Send transaction
    const tx = await faucetContract.requestTokens(recipientAddress, tokenSymbol);

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    // Return transaction hash and chain
    return NextResponse.json({
      success: true,
      txHash: receipt.transactionHash,
      chain,
    });
  } catch (error: any) {
    console.error("Error processing token request:", error);
    return NextResponse.json(
      { error: "Failed to process token request" }, // Removed details for security
      { status: 500 }
    );
  }
}