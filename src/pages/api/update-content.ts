// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { UTxO } from "@meshsdk/core";
import type { NextApiRequest, NextApiResponse } from "next";

type Data =
  | {
      signedTx: string;
    }
  | {
      error: string;
    };

type Body = {
  feeUtxo: UTxO;
  ownerTokenUtxo: UTxO;
  collateralUtxo: UTxO;
  walletAddress: string;
  registryNumber: number;
  newContentHashHex: string;
  contentNumber: number;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    // API 3: PUT /api/update-content
    // Update content
    if (req.method === "PUT") {
      const {
        feeUtxo,
        ownerTokenUtxo,
        collateralUtxo,
        walletAddress,
        registryNumber,
        newContentHashHex,
        contentNumber,
      }: Body = req.body;

      // Upload new content to IPFS and get Hash

      // Build Transaction

      // Return the signedTx

      res.status(200).json({ signedTx: "John Doe" });
    } else {
      res.status(405).json({ error: "Method Not Allowed" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
