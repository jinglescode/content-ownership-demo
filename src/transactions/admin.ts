import { MeshTxBuilder, IFetcher, UTxO } from "@meshsdk/core";
import {
  MeshTxInitiator,
  TxConstants,
  contentTokenRefTxHash,
  contentTokenRefTxId,
  getScriptCbor,
  getScriptHash,
  opsKey,
  oracleAddress,
  refScriptsAddress,
  stopKey,
} from "./common";
import {
  mConStr,
  mConStr1,
  mConStr2,
  serializeBech32Address,
  stringToHex,
  v2ScriptHashToBech32,
} from "@sidan-lab/sidan-csl";

export class AdminAction extends MeshTxInitiator {
  constructor(mesh: MeshTxBuilder, fetcher: IFetcher, constants: TxConstants) {
    super(mesh, fetcher, constants);
  }

  stopContentRegistry = async (txInHash: string, txInId: number, registryNumber: number) => {
    const registryAddrBech32 = v2ScriptHashToBech32(getScriptHash("ContentRegistry"));
    const oracleAddrBech32 = v2ScriptHashToBech32(getScriptHash("OracleValidator"));
    const scriptUtxos = await this.fetcher.fetchAddressUTxOs(registryAddrBech32);
    const serializedStopAddr = serializeBech32Address(refScriptsAddress);
    const contentTokenPolicyId = getScriptHash("ContentRefToken");
    const contentTokenName = stringToHex(`Registry (${registryNumber})`);
    const oracleUtxo = await this.fetcher.fetchAddressUTxOs(oracleAddrBech32);
    const oracleValidatorTxHash = oracleUtxo[0].input.txHash;
    const oracleValidatorTxId = oracleUtxo[0].input.outputIndex;

    console.log(scriptUtxos);
    console.log(contentTokenPolicyId + contentTokenName);

    const scriptUtxo = scriptUtxos.find(
      (utxo: UTxO) =>
        utxo.output.amount.find((amount) => amount.unit === contentTokenPolicyId + contentTokenName)?.quantity === "1"
    );

    const validatorTxHash = scriptUtxo.input.txHash;
    const validatorTxId = scriptUtxo.input.outputIndex;
    await this.mesh
      .txIn(txInHash, txInId)
      .spendingPlutusScriptV2()
      .txIn(validatorTxHash, validatorTxId)
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr(2, []))
      .txInScript(getScriptCbor("ContentRegistry"))
      .mintPlutusScriptV2()
      .mint(-1, contentTokenPolicyId, contentTokenName)
      .mintTxInReference(contentTokenRefTxHash, Number(contentTokenRefTxId))
      .mintRedeemerValue(mConStr1([]))
      .readOnlyTxInReference(oracleValidatorTxHash, oracleValidatorTxId)
      .changeAddress(this.constants.walletAddress)
      .txInCollateral(this.constants.collateralUTxO.txHash, this.constants.collateralUTxO.outputIndex)
      .requiredSignerHash(serializedStopAddr.pubKeyHash)
      .signingKey(this.constants.skey)
      .complete();
    const txBody = this.mesh.completeSigning();
    return txBody;
  };

  stopOracle = async (txInHash: string, txInId: number) => {
    const oracleTokenPolicyId = getScriptHash("OracleNFT");
    const oracleUtxo = await this.fetcher.fetchAddressUTxOs(oracleAddress);
    const oracleValidatorTxHash = oracleUtxo[0].input.txHash;
    const oracleValidatorTxId = oracleUtxo[0].input.outputIndex;

    await this.mesh
      .txIn(txInHash, txInId)
      .spendingPlutusScriptV2()
      .txIn(oracleValidatorTxHash, oracleValidatorTxId)
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr(3, []))
      .txInScript(getScriptCbor("OracleValidator"))
      .mintPlutusScriptV2()
      .mint(-1, oracleTokenPolicyId, "")
      .mintingScript(getScriptCbor("OracleNFT"))
      .mintRedeemerValue(mConStr1([]))
      .changeAddress(this.constants.walletAddress)
      .txInCollateral(this.constants.collateralUTxO.txHash, this.constants.collateralUTxO.outputIndex)
      .requiredSignerHash(opsKey)
      .requiredSignerHash(stopKey)
      .signingKey(this.constants.skey)
      .complete();
    const txBody = this.mesh.completeSigning();
    return txBody;
  };
}
