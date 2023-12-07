import { InfuraProvider, MaestroProvider, MeshTxBuilder, Data, IFetcher } from "@meshsdk/core";
import { blueprint, applyParamsToScript } from "../aiken";
import { AdminAction, ScriptsSetup } from "@/transactions";
import { useWallet } from "@meshsdk/react";
import { TxConstants, oraclePolicyId } from "@/transactions/common";
import { UserAction } from "@/transactions/user";
import { stringToHex } from "@sidan-lab/sidan-csl";

const infura = new InfuraProvider(
  process.env.NEXT_PUBLIC_INFURA_PROJECT_ID!,
  process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET!,
  {}
);

const maestro = new MaestroProvider({ apiKey: process.env.NEXT_PUBLIC_MAESTRO_APIKEY!, network: "Preprod" });
const walletAddress = process.env.NEXT_PUBLIC_WALLET_ADDRESS!;
const skey = process.env.NEXT_PUBLIC_SKEY!;

export default function Home() {
  const { connect, connected, wallet } = useWallet();
  async function uploadMarkdown() {
    const content = "---\ntitle: Hello World\n---\n\n# Hello World\n\nThis is my first post!";

    const blob = new Blob([content], {
      type: "text/markdown",
    });

    let formData = new FormData();
    formData.append("blob", blob, "test.md");

    const res = await infura.uploadContent(formData);
    console.log(9, res);

    // {Hash: "QmfYKhKUo3guDQyATYyTuzokkPXaeMqNro73P6iCJEmGAj",
    // Name: "test.md",
    // Size: "73",}

    return res;
    // https://ipfs.io/ipfs/QmfYKhKUo3guDQyATYyTuzokkPXaeMqNro73P6iCJEmGAj
  }

  async function createTokens() {
    // create cip68 tokens so that CID is stored on chain and owner can update it
  }

  const queryUtxos = async () => {
    // const utxos = await maestro.fetchAddressUTxOs(walletAddress);
    // // console.log(utxos);
    // console.log(
    //   "UTXOS",
    //   utxos.map((u) => {
    //     return {
    //       txHash: u.input.txHash,
    //       txId: u.input.outputIndex,
    //       amount: u.output.amount,
    //     };
    //   })
    // );

    const oracleUtxo = await maestro.fetchAddressUTxOs(
      "addr_test1wr3rrjfrwrakpz6rmn7uw4rk80hmzasgh7v9ehz5z8yp0cscavawv"
    );
    console.log("Oracle UTXO", oracleUtxo);
    // const correctUtxo = await getUtxosWithMinLovelace(100000000);
    // console.log("Correct UTXO", correctUtxo);

    // return utxos;
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
  // console.log("Param scripts", paramScript);

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

  const createContent = async () => {
    const utxo = await getUtxosWithMinLovelace(20000000);
    const txHash = await user.createContent(
      utxo[0].input,
      "baefdc6c5b191be372a794cd8d40d839ec0dbdd3c28957267dc8170074657374322e616461",
      stringToHex("QmWBaeu6y1zEcKbsEqCuhuDHPL3W8pZo"),
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
      <button className="m-2 p-2 bg-red-400" onClick={() => stopContentRegistry()}>
        Stop Content Registry
      </button>
      <button className="m-2 p-2 bg-red-400" onClick={() => stopOracle()}>
        Stop Oracle
      </button>
      <button className="m-2 p-2 bg-slate-500" onClick={() => queryUtxos()}>
        Query
      </button>
    </main>
  );
}
