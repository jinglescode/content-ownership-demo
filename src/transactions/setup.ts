import { Data, MeshTxBuilder, UTxO } from "@meshsdk/core";
import { applyParamsToScript, blueprint } from "../aiken";
import {
  PubKeyAddress,
  addrBech32ToObj,
  builtinByteString,
  conStr0,
  getV2ScriptHash,
  integer,
  mConStr0,
  mScriptAddress,
  pubKeyHash,
  scriptAddress,
  serializeBech32Address,
  txOutRef,
  v2ScriptHashToBech32,
} from "@sidan-lab/sidan-csl";

const refScriptsAddress = process.env.NEXT_PUBLIC_REF_SCRIPTS_ADDR!;
const [oracleValidatorRefTxHash, oracleValidatorRefTxId] =
  process.env.NEXT_PUBLIC_ORACLE_VALIDATOR_REF_UTXO!.split("#");
const operationAddress = process.env.NEXT_PUBLIC_WALLET_ADDRESS!;
const oraclePolicyId = process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID!;

export type InputUTxO = UTxO["input"];

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
        params: [txOutRef("3fbdf2b0b4213855dd9b87f7c94a50cf352ba6edfdded85ecb22cf9ceb75f814", 6)],
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

export type SetupConstants = {
  collateralUTxO: InputUTxO;
  walletAddress: string;
  skey: string;
};

const makeMeshTxBuilderBody = () => {
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

export class ScriptsSetup {
  mesh: MeshTxBuilder;

  setupConstants: SetupConstants;

  constructor(mesh: MeshTxBuilder, setupConstants: SetupConstants) {
    this.mesh = mesh;
    this.setupConstants = setupConstants;
  }

  signSubmitReset = async () => {
    const signedTx = this.mesh.completeSigning();
    const txHash = await this.mesh.submitTx(signedTx);
    this.mesh.meshTxBuilderBody = makeMeshTxBuilderBody();
    return txHash;
  };

  mintOneTimeMintingPolicy = async (paramTxHash: string, paramTxId: number) => {
    const script = blueprint.validators[2].compiledCode;
    const param: Data = {
      alternative: 0,
      fields: [{ alternative: 0, fields: [paramTxHash] }, paramTxId],
    };
    const paramScript = applyParamsToScript(script, { type: "Mesh", params: [param] });
    const policyId = getV2ScriptHash(paramScript);
    const tokenName = "";

    await this.mesh
      .txIn(paramTxHash, paramTxId)
      .txOut(this.setupConstants.walletAddress, [
        { unit: "lovelace", quantity: "2000000" },
        { unit: policyId + tokenName, quantity: "1" },
      ])
      .mintPlutusScriptV2()
      .mint(1, policyId, tokenName)
      .mintingScript(paramScript)
      .mintRedeemerValue({ alternative: 0, fields: [] })
      .txInCollateral(this.setupConstants.collateralUTxO.txHash, this.setupConstants.collateralUTxO.outputIndex)
      .changeAddress(this.setupConstants.walletAddress)
      .signingKey(this.setupConstants.skey)
      .complete();
    const txHash = await this.signSubmitReset();
    return txHash;
  };

  sendRefScriptOnchain = async (txInHash: string, txInId: number, scriptIndex: ScriptIndex) => {
    const scriptCbor = getScriptCbor(scriptIndex);
    await this.mesh
      .txIn(txInHash, txInId)
      .txOut(refScriptsAddress, [])
      .txOutReferenceScript(scriptCbor)
      .changeAddress(this.setupConstants.walletAddress)
      .signingKey(this.setupConstants.skey)
      .complete();
    const txHash = await this.signSubmitReset();
    return txHash;
  };

  setupOracleUtxo = async (txInHash: string, txInId: number) => {
    const scriptCbor = getScriptCbor("OracleValidator");
    const oracleValidatorScriptHash = getV2ScriptHash(scriptCbor);
    const oracleAddr = mScriptAddress(getV2ScriptHash(scriptCbor));
    const contentRefTokenPolicyId = getScriptHash("ContentRefToken");
    const contentRegistryAddr = mScriptAddress(getScriptHash("ContentRegistry"));
    const ownershipRefTokenPolicyId = getScriptHash("OwnershipRefToken");
    const ownershipRegistryAddr = mScriptAddress(getScriptHash("OwnershipRegistry"));
    const oracleAddrBech32 = v2ScriptHashToBech32(oracleValidatorScriptHash);
    const serializedOpsAddr = serializeBech32Address(operationAddress);
    const serializedStopAddr = serializeBech32Address(refScriptsAddress);

    const datumValue = mConStr0([
      oraclePolicyId,
      oracleAddr,
      contentRefTokenPolicyId,
      contentRegistryAddr,
      0,
      ownershipRefTokenPolicyId,
      ownershipRegistryAddr,
      0,
      serializedOpsAddr.pubKeyHash,
      serializedStopAddr.pubKeyHash,
    ]);

    this.mesh.meshTxBuilderBody = makeMeshTxBuilderBody();
    await this.mesh
      .txIn(txInHash, txInId)
      .txOut(oracleAddrBech32, [{ unit: oraclePolicyId + "", quantity: "1" }])
      .txOutInlineDatumValue(datumValue)
      .changeAddress(this.setupConstants.walletAddress)
      .signingKey(this.setupConstants.skey)
      .complete();

    const txHash = await this.signSubmitReset();
    console.log("txHash", txHash);

    return txHash;
  };
}

// pub type OracleDatum {
//   oracle_nft: PolicyId,
//   oracle_address: Address,
//   content_registry_ref_token: PolicyId,
//   content_registry_address: Address,
//   content_registry_count: Int,
//   ownership_registry_ref_token: PolicyId,
//   ownership_registry_address: Address,
//   ownership_registry_count: Int,
//   operation_key: ByteArray,
//   stop_key: ByteArray,
// }
