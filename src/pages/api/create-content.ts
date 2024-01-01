import { MeshTxBuilder, UTxO } from "@meshsdk/core";
import type { NextApiRequest, NextApiResponse } from "next";
import { maestro, uploadMarkdown } from "../../backend";
import { UserAction } from "@/transactions/user";

type Data =
  | {
      signedTx: string;
    }
  | {
      error: string;
    };

type Body = {
  walletAddress: string;
  feeUtxo: UTxO;
  collateralUtxo: UTxO;
  ownerAssetHex: string;
  registryNumber: number;
  content: any;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // API 1: POST /api/create-content
  try {
    if (req.method === "POST") {
      const { walletAddress, feeUtxo, collateralUtxo, ownerAssetHex, registryNumber, content }: Body = req.body;

      // Upload content to IPFS and get Hash
      const contentHashHex = await uploadMarkdown(content);

      // Build Transaction
      const mesh = new MeshTxBuilder({ fetcher: maestro, submitter: maestro });
      const user = new UserAction(mesh, maestro, {
        collateralUTxO: collateralUtxo,
        walletAddress: walletAddress,
      });

      const signedTx = await user.createContent(feeUtxo, ownerAssetHex, contentHashHex, registryNumber);

      res.status(200).json({ signedTx });
    } else {
      res.status(405).json({ error: "Method Not Allowed" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
