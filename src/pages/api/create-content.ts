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
  collateralUtxo: UTxO;
  ownerAssetHex: string;
  registryNumber: number;
  content: any;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // API 1: POST /api/create-content
  try {
    if (req.method === "POST") {
      const { feeUtxo, collateralUtxo, ownerAssetHex, registryNumber }: Body = req.body;

      // Upload content to IPFS and get Hash

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
