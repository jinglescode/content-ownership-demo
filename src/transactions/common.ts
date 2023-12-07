import { IFetcher, MeshTxBuilder, UTxO } from "@meshsdk/core";
import { applyParamsToScript, blueprint } from "../aiken";
import {
  builtinByteString,
  txOutRef,
  getV2ScriptHash,
  mConStr0,
  mScriptAddress,
  serializeBech32Address,
  v2ScriptHashToBech32,
} from "@sidan-lab/sidan-csl";

export type InputUTxO = UTxO["input"];

export const refScriptsAddress = process.env.NEXT_PUBLIC_REF_SCRIPTS_ADDR!;
export const [oracleValidatorRefTxHash, oracleValidatorRefTxId] =
  process.env.NEXT_PUBLIC_ORACLE_VALIDATOR_REF_UTXO!.split("#");
export const [contentTokenRefTxHash, contentTokenRefTxId] = process.env.NEXT_PUBLIC_CONTENT_TOKEN_REF_UTXO!.split("#");
export const [ownershipTokenRefTxHash, ownershipTokenRefTxId] =
  process.env.NEXT_PUBLIC_OWNERSHIP_TOKEN_REF_UTXO!.split("#");
export const operationAddress = process.env.NEXT_PUBLIC_WALLET_ADDRESS!;
export const oraclePolicyId = process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID!;

export type ScriptIndex =
  | "OracleNFT"
  | "OracleValidator"
  | "ContentRegistry"
  | "ContentRefToken"
  | "OwnershipRegistry"
  | "OwnershipRefToken";

export const getScriptCbor = (scriptIndex: ScriptIndex) => {
  const validators = blueprint.validators;
  const oracleNFTToParam = builtinByteString(oraclePolicyId);
  switch (scriptIndex) {
    case "OracleNFT":
      return applyParamsToScript(validators[2].compiledCode, {
        type: "Raw",
        params: [txOutRef("13007318e950530a28135e2c17d10e14fa3cb7479386a1326114c0dedc0e1334", 0)],
      });
    case "OracleValidator":
      return applyParamsToScript(validators[3].compiledCode, { type: "Raw", params: [] });
    case "ContentRegistry":
      return applyParamsToScript(validators[0].compiledCode, {
        type: "Raw",
        params: [oracleNFTToParam],
      });
    case "ContentRefToken":
      return applyParamsToScript(validators[1].compiledCode, { type: "Raw", params: [oracleNFTToParam] });
    case "OwnershipRegistry":
      return applyParamsToScript(validators[4].compiledCode, { type: "Raw", params: [oracleNFTToParam] });
    case "OwnershipRefToken":
      return applyParamsToScript(validators[5].compiledCode, { type: "Raw", params: [oracleNFTToParam] });
  }
};

export const getScriptHash = (scriptIndex: ScriptIndex) => {
  const scriptCbor = getScriptCbor(scriptIndex);
  return getV2ScriptHash(scriptCbor);
};

export type TxConstants = {
  collateralUTxO: InputUTxO;
  walletAddress: string;
  skey: string;
};

export const makeMeshTxBuilderBody = () => {
  return {
    inputs: [],
    outputs: [],
    collaterals: [],
    requiredSignatures: [],
    referenceInputs: [],
    mints: [],
    changeAddress: "",
    metadata: [],
    validityRange: {},
    signingKey: [],
  };
};

export const oracleValScriptHash = getScriptHash("OracleValidator");
export const contentRegScriptHash = getScriptHash("ContentRegistry");
export const ownershipRegScriptHash = getScriptHash("OwnershipRegistry");

// export const oraclePolicyId = getScriptHash("OracleNFT");
export const contentPolicyId = getScriptHash("ContentRefToken");
export const ownershipPolicyId = getScriptHash("OwnershipRefToken");
console.log("Oracle Policy ID", oraclePolicyId);
console.log("Content Policy ID", contentPolicyId);
console.log("Ownership Policy ID", ownershipPolicyId);

export const oracleAddress = v2ScriptHashToBech32(getScriptHash("OracleValidator"));
export const contentAddress = v2ScriptHashToBech32(getScriptHash("ContentRegistry"));
export const ownershipAddress = v2ScriptHashToBech32(getScriptHash("OwnershipRegistry"));
console.log("Oracle Address", oracleAddress);
console.log("Content Address", contentAddress);
console.log("Ownership Address", ownershipAddress);

export const serializedOpsPlutusAddr = serializeBech32Address(operationAddress);
export const serializedStopPlutusAddr = serializeBech32Address(refScriptsAddress);
export const opsKey = serializedOpsPlutusAddr.pubKeyHash;
export const stopKey = serializedStopPlutusAddr.pubKeyHash;

export class MeshTxInitiator {
  mesh: MeshTxBuilder;
  fetcher: IFetcher;
  constants: TxConstants;

  constructor(mesh: MeshTxBuilder, fetcher: IFetcher, constants: TxConstants) {
    this.mesh = mesh;
    this.fetcher = fetcher;
    this.constants = constants;
  }

  protected signSubmitReset = async () => {
    const signedTx = this.mesh.completeSigning();
    const txHash = await this.mesh.submitTx(signedTx);
    this.mesh.meshTxBuilderBody = makeMeshTxBuilderBody();
    return txHash;
  };

  protected getOracleDatum = (contentRegistryCount: number, ownershipRegistryCount: number) => {
    const oracleAddr = mScriptAddress(oracleValScriptHash);
    const contentRegistryAddr = mScriptAddress(contentRegScriptHash);
    const ownershipRegistryAddr = mScriptAddress(ownershipRegScriptHash);

    return mConStr0([
      oraclePolicyId,
      oracleAddr,
      contentPolicyId,
      contentRegistryAddr,
      contentRegistryCount,
      ownershipPolicyId,
      ownershipRegistryAddr,
      ownershipRegistryCount,
      opsKey,
      stopKey,
    ]);
  };
}
