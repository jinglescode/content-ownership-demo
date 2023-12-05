import { InfuraProvider } from "@meshsdk/core";
import { blueprint, applyParamsToScript } from "../aiken";

const infura = new InfuraProvider(
  process.env.NEXT_PUBLIC_INFURA_PROJECT_ID!,
  process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET!,
  {}
);

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

  const script = blueprint.validators[2].compiledCode;
  const paramScript = applyParamsToScript(script, [
    [{ bytes: "3fbdf2b0b4213855dd9b87f7c94a50cf352ba6edfdded85ecb22cf9ceb75f814" }],
  ]);
  console.log("Param scripts", paramScript);

  return (
    <main>
      <button onClick={() => uploadMarkdown()}>upload</button>
    </main>
  );
}
