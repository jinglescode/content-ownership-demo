import { Data, IFetcher, MeshTxBuilder } from "@meshsdk/core";
import { applyParamsToScript, blueprint } from "../aiken";
import {
  getV2ScriptHash,
  mConStr0,
  mConStr1,
  mScriptAddress,
  serializeBech32Address,
  stringToHex,
  v2ScriptHashToBech32,
} from "@sidan-lab/sidan-csl";
import {
  TxConstants,
  ScriptIndex,
  getScriptCbor,
  refScriptsAddress,
  oraclePolicyId,
  getScriptHash,
  oracleValidatorRefTxHash,
  oracleValidatorRefTxId,
  contentTokenRefTxHash,
  contentTokenRefTxId,
  ownershipTokenRefTxHash,
  ownershipTokenRefTxId,
  operationAddress,
  makeMeshTxBuilderBody,
  MeshTxInitiator,
  oracleAddress,
  contentAddress,
  contentPolicyId,
} from "./common";

export class ScriptsSetup extends MeshTxInitiator {
  constructor(mesh: MeshTxBuilder, fetcher: IFetcher, setupConstants: TxConstants) {
    super(mesh, fetcher, setupConstants);
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
      .txOut(this.constants.walletAddress, [
        { unit: "lovelace", quantity: "2000000" },
        { unit: policyId + tokenName, quantity: "1" },
      ])
      .mintPlutusScriptV2()
      .mint(1, policyId, tokenName)
      .mintingScript(paramScript)
      .mintRedeemerValue({ alternative: 0, fields: [] })
      .txInCollateral(this.constants.collateralUTxO.txHash, this.constants.collateralUTxO.outputIndex)
      .changeAddress(this.constants.walletAddress)
      .signingKey(this.constants.skey)
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
      .changeAddress(this.constants.walletAddress)
      .signingKey(this.constants.skey)
      .complete();
    const txHash = await this.signSubmitReset();
    return txHash;
  };

  setupOracleUtxo = async (txInHash: string, txInId: number, nftTxHash: string, nftTxId: number) => {
    const scriptCbor = getScriptCbor("OracleValidator");
    const oracleValidatorScriptHash = getV2ScriptHash(scriptCbor);
    const oracleAddrBech32 = v2ScriptHashToBech32(oracleValidatorScriptHash);
    const datumValue = this.getOracleDatum(0, 0);

    await this.mesh
      .txIn(txInHash, txInId)
      .txIn(nftTxHash, nftTxId)
      .txOut(oracleAddrBech32, [{ unit: oraclePolicyId + "", quantity: "1" }])
      .txOutInlineDatumValue(datumValue)
      .changeAddress(this.constants.walletAddress)
      .signingKey(this.constants.skey)
      .complete();

    const txHash = await this.signSubmitReset();
    return txHash;
  };

  createContentRegistry = async (txInHash: string, txInId: number) => {
    const currentOracleDatum = await this.getCurrentOracleDatum();
    const contentNumber = currentOracleDatum.fields[4].int;
    const ownershipNumber = currentOracleDatum.fields[7].int;

    const contentTokenName = stringToHex(`Registry (${contentNumber})`);
    const scriptUtxo = await this.fetcher.fetchAddressUTxOs(oracleAddress);
    const oracleValidatorTxHash = scriptUtxo[0].input.txHash;
    const oracleValidatorTxId = scriptUtxo[0].input.outputIndex;
    const oracleDatumValue = this.getOracleDatum(contentNumber + 1, ownershipNumber);
    const contentDatumValue = mConStr0([0, []]);
    console.log("Oracle Datum", oracleDatumValue);

    await this.mesh
      .txIn(txInHash, txInId)
      .spendingPlutusScriptV2()
      .txIn(oracleValidatorTxHash, oracleValidatorTxId)
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr0([]))
      .spendingTxInReference(oracleValidatorRefTxHash, Number(oracleValidatorRefTxId), getScriptHash("OracleValidator"))
      .txOut(oracleAddress, [{ unit: oraclePolicyId + "", quantity: "1" }])
      .txOutInlineDatumValue(oracleDatumValue)
      .txOut(contentAddress, [{ unit: contentPolicyId + contentTokenName, quantity: "1" }])
      .txOutInlineDatumValue(contentDatumValue)
      .mintPlutusScriptV2()
      .mint(1, contentPolicyId, contentTokenName)
      .mintTxInReference(contentTokenRefTxHash, Number(contentTokenRefTxId))
      .mintRedeemerValue(mConStr0([]))
      .txInCollateral(this.constants.collateralUTxO.txHash, this.constants.collateralUTxO.outputIndex)
      .changeAddress(this.constants.walletAddress)
      .signingKey(this.constants.skey)
      .complete();

    const txHash = await this.signSubmitReset();
    return txHash;
  };

  createOwnershipRegistry = async (txInHash: string, txInId: number) => {
    const currentOracleDatum = await this.getCurrentOracleDatum();
    const contentNumber = currentOracleDatum.fields[4].int;
    const ownershipNumber = currentOracleDatum.fields[7].int;

    const oracleAddrBech32 = v2ScriptHashToBech32(getScriptHash("OracleValidator"));
    const ownershipRegistryBech32 = v2ScriptHashToBech32(getScriptHash("OwnershipRegistry"));
    const ownershipTokenPolicyId = getScriptHash("OwnershipRefToken");
    const ownershipTokenName = stringToHex(`Registry (${ownershipNumber})`);
    const scriptUtxo = await this.fetcher.fetchAddressUTxOs(oracleAddrBech32);
    console.log("oracle utxo", scriptUtxo);

    const oracleValidatorTxHash = scriptUtxo[0].input.txHash;
    const oracleValidatorTxId = scriptUtxo[0].input.outputIndex;
    const oracleDatumValue = this.getOracleDatum(contentNumber, ownershipNumber + 1);
    console.log("Oracle Datum", oracleDatumValue);
    const ownershipDatumValue = mConStr0([0, []]);

    this.mesh.meshTxBuilderBody = makeMeshTxBuilderBody();

    await this.mesh
      .txIn(txInHash, txInId)
      .spendingPlutusScriptV2()
      .txIn(oracleValidatorTxHash, oracleValidatorTxId)
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr1([]))
      .spendingTxInReference(oracleValidatorRefTxHash, Number(oracleValidatorRefTxId), getScriptHash("OracleValidator"))
      .txOut(oracleAddrBech32, [{ unit: oraclePolicyId + "", quantity: "1" }])
      .txOutInlineDatumValue(oracleDatumValue)
      .txOut(ownershipRegistryBech32, [{ unit: ownershipTokenPolicyId + ownershipTokenName, quantity: "1" }])
      .txOutInlineDatumValue(ownershipDatumValue)
      .mintPlutusScriptV2()
      .mint(1, ownershipTokenPolicyId, ownershipTokenName)
      .mintTxInReference(ownershipTokenRefTxHash, Number(ownershipTokenRefTxId))
      .mintRedeemerValue(mConStr0([]))
      .txInCollateral(this.constants.collateralUTxO.txHash, this.constants.collateralUTxO.outputIndex)
      .changeAddress(this.constants.walletAddress)
      .signingKey(this.constants.skey)
      .complete();

    const txHash = await this.signSubmitReset();
    return txHash;
  };
}
