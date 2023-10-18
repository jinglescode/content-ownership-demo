import { InfuraProvider } from "@meshsdk/core";

const infura = new InfuraProvider(
  process.env.NEXT_PUBLIC_INFURA_PROJECT_ID!,
  process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET!,
  {}
);

export default function Home() {
  async function uploadMarkdown() {
    const content =
      "---\ntitle: Hello World\n---\n\n# Hello World\n\nThis is my first post!";

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

  return (
    <main>
      <button onClick={() => uploadMarkdown()}>upload</button>
    </main>
  );
}
