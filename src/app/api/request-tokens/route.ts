import { NextRequest, NextResponse } from "next/server";
import { getFaucetContract, getProvider } from "../../../utils/ethers";
import { NETWORK } from "@/utils/constants";

// Define the request body type
interface RequestBody {
  recipientAddress: string;
  tokenSymbol: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { recipientAddress, tokenSymbol } = body;

    // Basic validation
    if (!recipientAddress || !tokenSymbol) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Load private key from environment variable
    const privateKey = process.env.FAUCET_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get faucet contract
    const faucetContract = await getFaucetContract(privateKey);

    // Check if user can request tokens (not in cooldown)
    try {
      const canRequest = await faucetContract.canRequestToken(
        recipientAddress,
        tokenSymbol
      );
      console.log("canRequest", canRequest);
      if (!canRequest) {
        const waitTime = await faucetContract.timeUntilNextRequest(
          recipientAddress,
          tokenSymbol
        );
        const waitTimeMinutes = Math.ceil(Number(waitTime) / 60);
        return NextResponse.json(
          {
            error: `Please wait approximately ${waitTimeMinutes} minutes before requesting ${tokenSymbol} again.`,
          },
          { status: 429 }
        );
      }
    } catch (error) {
      console.log("Error checking request eligibility:", error);
      console.error("Error checking request eligibility:", error);
      return NextResponse.json(
        { error: "Failed to check request eligibility" },
        { status: 500 }
      );
    }

    // Send transaction
    const tx = await faucetContract.requestTokens(
      recipientAddress,
      tokenSymbol
    );

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    // Return transaction hash
    return NextResponse.json({
      success: true,
      txHash: receipt.transactionHash,
    });
  } catch (error: any) {
    console.error("Error processing token request:", error);
    return NextResponse.json(
      { error: "Failed to process token request", details: error.message },
      { status: 500 }
    );
  }
}
