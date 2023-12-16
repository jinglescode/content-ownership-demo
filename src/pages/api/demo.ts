// API 1: POST /api/demo/content
// Create content
// Body {
//   feeUtxo: InputUTxO, ownerAssetHex: string, contentHashHex: string, registryNumber: number
// }
// Response: txHash

// API 2: GET /api/demo/content
// Get all content
// Response: Content[]

// API 3: GET /api/demo/content/:id
// Get content by id
// Response: Content

// API 3: PUT /api/demo/update-content
// Update content
// Body {
//   feeUtxo: UTxO;
//   ownerTokenUtxo: UTxO;
//   collateralUtxo: UTxO;
//   walletAddress: string;
//   registryNumber: number;
//   newContentHashHex: string;
//   contentNumber: number;
// };
// Response: txHash

// API 4: PUT /api/demo/transfer-content
// Transfer content
// Body {
//   feeUtxo: UTxO;
//   ownerTokenUtxo: UTxO;
//   collateralUtxo: UTxO;
//   walletAddress: string;
//   registryNumber: number;
//   newOwnerAssetHex: string;
//   contentNumber: number;
// };
// Response: txHash
