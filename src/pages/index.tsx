import { InfuraProvider, MaestroProvider, MeshTxBuilder, IFetcher } from "@meshsdk/core";
import { AdminAction, ScriptsSetup } from "@/transactions";
import { useWallet } from "@meshsdk/react";
import { TxConstants, oraclePolicyId } from "@/transactions/common";
import { UserAction } from "@/transactions/user";
import { mConStr0, stringToHex } from "@sidan-lab/sidan-csl";
import multihashes from "multihashes";
import { toPlutusData } from "@/aiken";

const infura = new InfuraProvider(
  process.env.NEXT_PUBLIC_INFURA_PROJECT_ID!,
  process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET!,
  {}
);

const maestro = new MaestroProvider({ apiKey: process.env.NEXT_PUBLIC_MAESTRO_APIKEY!, network: "Preprod" });
const walletAddress = process.env.NEXT_PUBLIC_WALLET_ADDRESS!;
const skey = process.env.NEXT_PUBLIC_SKEY!;

// 1. Uploading content to IPFS + create content on-chain
// 2. Retrieve content from blockchain, resolve back to content stored in IPFS

export default function Home() {
  const { connect, connected, wallet } = useWallet();

  async function uploadMarkdown() {
    const content = "---\ntitle: Hello World\n---\n\n# Hello World\n\nThis is my first post!";

    const blob = new Blob([content], {
      type: "text/markdown",
    });

    let formData = new FormData();
    formData.append("blob", blob, "test.md");

    const res: any = await infura.uploadContent(formData);
    // {Hash: "QmfYKhKUo3guDQyATYyTuzokkPXaeMqNro73P6iCJEmGAj",
    // Name: "test.md",
    // Size: "73",}
    const ipfsHash: string = res.Hash;

    const ipfsContentBytes = multihashes.fromB58String(ipfsHash);
    const ipfsContentHex = Buffer.from(ipfsContentBytes).toString("hex").slice(4);

    console.log("IPFS Hash", ipfsContentHex, ipfsContentHex.length);

    await createContent(ipfsContentHex);
    // return res;
  }

  const decodeOnchainRecord = (hexString: string) => {
    const decodedBytes = Buffer.from("1220" + hexString, "hex");
    const decodedIpfsHash = multihashes.toB58String(decodedBytes);
    return decodedIpfsHash;
  };

  async function createTokens() {
    // create cip68 tokens so that CID is stored on chain and owner can update it
  }

  const queryUtxos = async () => {
    const plutusData = toPlutusData(mConStr0(["1231512", ["123412", "12512"]]));
    console.log("Plutus Data", plutusData.to_json(1));
  };

  const getUtxosWithMinLovelace = async (lovelace: number) => {
    const utxos = await maestro.fetchAddressUTxOs(walletAddress);
    return utxos.filter((u) => {
      const lovelaceAmount = u.output.amount.find((a: any) => a.unit === "lovelace")?.quantity;
      return Number(lovelaceAmount) > lovelace;
    });
  };

  const getUtxosWithToken = async (assetHex: string) => {
    const utxos = await maestro.fetchAddressUTxOs(walletAddress);
    return utxos.filter((u) => {
      const assetAmount = u.output.amount.find((a: any) => a.unit === assetHex)?.quantity;
      return Number(assetAmount) >= 1;
    });
  };

  const mesh = new MeshTxBuilder({
    fetcher: maestro,
    submitter: maestro,
    // evaluator: maestro,
  });

  const txParams: [MeshTxBuilder, IFetcher, TxConstants] = [
    mesh,
    maestro,
    {
      walletAddress,
      skey,
      collateralUTxO: {
        txHash: "3fbdf2b0b4213855dd9b87f7c94a50cf352ba6edfdded85ecb22cf9ceb75f814",
        outputIndex: 7,
      },
    },
  ];

  const setup = new ScriptsSetup(...txParams);
  const admin = new AdminAction(...txParams);
  const user = new UserAction(...txParams);

  const mintOneTimeMintingPolicy = async () => {
    const utxo = await getUtxosWithMinLovelace(100000000);
    const txHash = utxo[0].input.txHash;
    const txId = utxo[0].input.outputIndex;
    const confirmTxHash = await setup.mintOneTimeMintingPolicy(txHash, txId);
    console.log("TxHash", confirmTxHash);
  };
  const sendRefScriptOnchain = async () => {
    const utxo = await getUtxosWithMinLovelace(100000000);
    const txHash = utxo[0].input.txHash;
    const txId = utxo[0].input.outputIndex;
    const confirmTxHash = await setup.sendRefScriptOnchain(txHash, txId, "OwnershipRegistry");
    console.log("TxHash", confirmTxHash);
  };

  const sendOracleNFTtoScript = async () => {
    const utxo = await getUtxosWithMinLovelace(100000000);
    const txHash = utxo[0].input.txHash;
    const txId = utxo[0].input.outputIndex;
    const nftUtxo = await getUtxosWithToken(oraclePolicyId);
    const nftTxHash = nftUtxo[0].input.txHash;
    const nftTxId = nftUtxo[0].input.outputIndex;
    const confirmTxHash = await setup.setupOracleUtxo(txHash, txId, nftTxHash, nftTxId);
    console.log("TxHash", confirmTxHash);
  };

  const createContentRegistry = async () => {
    const utxo = await getUtxosWithMinLovelace(10000000);
    const txHash = utxo[0].input.txHash;
    const txId = utxo[0].input.outputIndex;
    const confirmTxHash = await setup.createContentRegistry(txHash, txId, 0, 0);
    console.log("TxHash", confirmTxHash);
  };

  const createOwnershipRegistry = async () => {
    const utxo = await getUtxosWithMinLovelace(20000000);
    const txHash = utxo[0].input.txHash;
    const txId = utxo[0].input.outputIndex;
    const confirmTxHash = await setup.createOwnershipRegistry(txHash, txId, 1, 0);
    console.log("TxHash", confirmTxHash);
  };

  const stopContentRegistry = async () => {
    const utxo = await getUtxosWithMinLovelace(20000000);
    const txHash = utxo[0].input.txHash;
    const txId = utxo[0].input.outputIndex;
    const txBody = await admin.stopContentRegistry(txHash, txId, 1);
    const signedTx = await wallet.signTx(txBody, true);
    const confirmTxHash = await maestro.submitTx(signedTx);
    console.log("TxHash", confirmTxHash);
  };

  const stopOracle = async () => {
    const utxo = await getUtxosWithMinLovelace(20000000);
    const txHash = utxo[0].input.txHash;
    const txId = utxo[0].input.outputIndex;
    const txBody = await admin.stopOracle(txHash, txId);
    const signedTx = await wallet.signTx(txBody, true);
    const confirmTxHash = await maestro.submitTx(signedTx);
    console.log("TxHash", confirmTxHash);
  };

  const createContent = async (contentHex = "ff942613ef86667df9e8f2488f29615fc9aaad7906e266f686153d5b7c81abe0") => {
    const utxo = await getUtxosWithMinLovelace(20000000);
    const txHash = await user.createContent(
      utxo[0].input,
      "baefdc6c5b191be372a794cd8d40d839ec0dbdd3c28957267dc8170074657374322e616461",
      contentHex,
      0
    );
    console.log("TxHash", txHash);
  };

  return (
    <main>
      <span className="text-black">Connected: {connected ? "Yes" : "No"}</span>
      <button
        className="m-2 p-2 bg-slate-500"
        onClick={() => {
          connect("eternl");
        }}>
        Connect Eternl
      </button>
      <button className="m-2 p-2 bg-slate-500" onClick={() => sendRefScriptOnchain()}>
        Send Ref Script
      </button>
      <button className="m-2 p-2 bg-slate-500" onClick={() => mintOneTimeMintingPolicy()}>
        Mint Oracle NFT
      </button>
      <button className="m-2 p-2 bg-slate-500" onClick={() => sendOracleNFTtoScript()}>
        Send Oracle NFT
      </button>
      <button className="m-2 p-2 bg-slate-500" onClick={() => createContentRegistry()}>
        Create Content Registry
      </button>
      <button className="m-2 p-2 bg-slate-500" onClick={() => createOwnershipRegistry()}>
        Create Ownership Registry
      </button>
      <button className="m-2 p-2 bg-blue-500" onClick={() => createContent()}>
        Create Content
      </button>
      <button className="m-2 p-2 bg-blue-500" onClick={() => uploadMarkdown()}>
        Upload MD
      </button>
      <button className="m-2 p-2 bg-red-400" onClick={() => stopContentRegistry()}>
        Stop Content Registry
      </button>
      <button className="m-2 p-2 bg-red-400" onClick={() => stopOracle()}>
        Stop Oracle
      </button>
      <button className="m-2 p-2 bg-slate-500" onClick={() => queryUtxos()}>
        Test
      </button>
    </main>
  );
}
