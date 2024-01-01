import type { NextApiRequest, NextApiResponse } from "next";

type Content = {
  registryNumber: number;
  contentHashHex: string;
  ownerAssetHex: string;
  content: any;
};

type Data =
  | Content
  | {
      error: string;
    };

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // API 3: GET /api/get-content/:id
  // Get content by id
  try {
    if (req.method === "GET") {
      const pathParams = req.query.slug as string[];
      const contentId = pathParams[0];
      console.log("Content Id", contentId);

      // Query both registries on current id

      // Get the ownerAssetHex and contentHashHex

      // Resolve content from IPFS

      // Return the content

      res
        .status(200)
        .json({ registryNumber: 1, contentHashHex: "0x123", ownerAssetHex: "0x123", content: "Hello World" });
    } else {
      res.status(405).json({ error: "Method Not Allowed" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
