import { InfuraProvider, MaestroProvider, MeshTxBuilder, Data } from "@meshsdk/core";
import { blueprint, applyParamsToScript } from "../aiken";
import { ScriptsSetup } from "@/transactions";

const infura = new InfuraProvider(
  process.env.NEXT_PUBLIC_INFURA_PROJECT_ID!,
  process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET!,
  {}
);

const maestro = new MaestroProvider({ apiKey: process.env.NEXT_PUBLIC_MAESTRO_APIKEY!, network: "Preprod" });
const walletAddress = process.env.NEXT_PUBLIC_WALLET_ADDRESS!;
const skey = process.env.NEXT_PUBLIC_SKEY!;

export default function Home() {
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
    const utxos = await maestro.fetchAddressUTxOs(walletAddress);
    // console.log(utxos);
    console.log(
      "UTXOS",
      utxos.map((u) => {
        return {
          txHash: u.input.txHash,
          txId: u.input.outputIndex,
          amount: u.output.amount,
        };
      })
    );
    // const correctUtxo = await getUtxosWithMinLovelace(100000000);
    // console.log("Correct UTXO", correctUtxo);

    return utxos;
  };

  const getUtxosWithMinLovelace = async (lovelace: number) => {
    const utxos = await maestro.fetchAddressUTxOs(walletAddress);
    return utxos.filter((u) => {
      const lovelaceAmount = u.output.amount.find((a: any) => a.unit === "lovelace")?.quantity;
      return Number(lovelaceAmount) > lovelace;
    });
  };

  const mesh = new MeshTxBuilder({
    fetcher: maestro,
    submitter: maestro,
    evaluator: maestro,
  });

  const setup = new ScriptsSetup(mesh, {
    walletAddress,
    skey,
    collateralUTxO: {
      txHash: "3fbdf2b0b4213855dd9b87f7c94a50cf352ba6edfdded85ecb22cf9ceb75f814",
      outputIndex: 7,
    },
  });
  // console.log("Param scripts", paramScript);

  const sendRefScriptOnchain = async () => {
    const utxo = await getUtxosWithMinLovelace(100000000);
    const txHash = utxo[0].input.txHash;
    const txId = utxo[0].input.outputIndex;
    const script = await setup.sendRefScriptOnchain(txHash, txId, "OracleValidator");
    console.log("Script", script);
  };

  const sendOracleNFTtoScript = async () => {
    const txHash = await setup.setupOracleUtxo("640facd8ef37526f46302c21ffb8cf5f7456bb53f4fca406ef5b5d50ab7d2caf", 0);
  };

  return (
    <main>
      <button className="m-2 p-2 bg-slate-300" onClick={() => sendRefScriptOnchain()}>
        Send OracleVad Ref Script
      </button>
      <button className="m-2 p-2 bg-slate-300" onClick={() => sendOracleNFTtoScript()}>
        Send Oracle NFT
      </button>
      <button className="m-2 p-2 bg-slate-300" onClick={() => queryUtxos()}>
        Query
      </button>
    </main>
  );
}

// {
//   "address": "addr_test1vpw22xesfv0hnkfw4k5vtrz386tfgkxu6f7wfadug7prl7s6gt89x",
//   "tx_hash": "3fbdf2b0b4213855dd9b87f7c94a50cf352ba6edfdded85ecb22cf9ceb75f814",
//   "tx_index": 6,
//   "output_index": 6,
//   "amount": [
//     {
//       "unit": "lovelace",
//       "quantity": "10000000"
//     }
//   ],
//   "block": "54f8ac30aab85d027b283fd124f969e0f5a0534343235e89e6d946862efe967d",
//   "data_hash": null,
//   "inline_datum": null,
//   "reference_script_hash": null
// },
