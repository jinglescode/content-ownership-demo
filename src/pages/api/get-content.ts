// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Content = {
  registryNumber: number;
  contentHashHex: string;
  ownerAssetHex: string;
  content: any;
};

type Data =
  | Content[]
  | Content
  | {
      error: string;
    };

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    if (req.method === "GET") {
      // API 2: GET /api/get-content
      // Get all content
      // Response: Content[]

      // API 3: GET /api/get-content/:id
      // Get content by id
      // Response: Content

      // Query both registries (do filter if have id)

      // Get the ownerAssetHex and contentHashHex

      // Resolve content from IPFS

      // Return the content

      res.status(200).json([]);
    } else {
      res.status(405).json({ error: "Method Not Allowed" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
