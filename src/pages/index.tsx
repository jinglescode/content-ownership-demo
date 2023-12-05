import { InfuraProvider, MaestroProvider, MeshTxBuilder, Data } from "@meshsdk/core";
import { blueprint, applyParamsToScript, getV2ScriptHash } from "../aiken";

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
    console.log("UTXOS", utxos);
    return utxos;
  };

  const mesh = new MeshTxBuilder({
    fetcher: maestro,
    submitter: maestro,
    evaluator: maestro,
  });

  const mintOneTimeMintingPolicy = async () => {
    const paramScript = applyParam();
    const policyId = getV2ScriptHash(paramScript);
    const tokenName = "";
    console.log("Policy ID", policyId);

    await mesh
      .txIn("3fbdf2b0b4213855dd9b87f7c94a50cf352ba6edfdded85ecb22cf9ceb75f814", 6)
      .txOut(walletAddress, [
        { unit: "lovelace", quantity: "5000000" },
        { unit: policyId + tokenName, quantity: "1" },
      ])
      .mintPlutusScriptV2()
      .mint(1, policyId, tokenName)
      .mintingScript(paramScript)
      .mintRedeemerValue({ alternative: 0, fields: [] })
      .txInCollateral("3fbdf2b0b4213855dd9b87f7c94a50cf352ba6edfdded85ecb22cf9ceb75f814", 7)
      .changeAddress(walletAddress)
      .signingKey(skey)
      .complete();

    const signedTx = mesh.completeSigning();
    const txHash = await mesh.submitTx(signedTx);
    console.log("TX HASH", txHash);
  };

  const applyParam = () => {
    const script = blueprint.validators[2].compiledCode;
    const param: Data = {
      alternative: 0,
      fields: [{ alternative: 0, fields: ["3fbdf2b0b4213855dd9b87f7c94a50cf352ba6edfdded85ecb22cf9ceb75f814"] }, 6],
    };
    const paramScript = applyParamsToScript(script, [param]);
    console.log("Param scripts", paramScript);
    return paramScript;
  };

  // console.log("Param scripts", paramScript);

  return (
    <main>
      <button onClick={() => applyParam()}>Apply</button>
      <button onClick={() => mintOneTimeMintingPolicy()}>mint</button>
      <button onClick={() => queryUtxos()}>Query</button>
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
