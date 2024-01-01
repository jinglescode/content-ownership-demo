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
  newOwnerAssetHex: string;
  contentNumber: number;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    if (req.method === "POST") {
      // API 4: PUT /api/transfer-content
      // Transfer content
      const {
        feeUtxo,
        ownerTokenUtxo,
        collateralUtxo,
        walletAddress,
        registryNumber,
        newOwnerAssetHex,
        contentNumber,
      }: Body = req.body;

      // Only Cardano transaction build

      res.status(200).json({ signedTx: "John Doe" });
    } else {
      res.status(405).json({ error: "Method Not Allowed" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
