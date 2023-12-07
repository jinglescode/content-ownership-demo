import { MeshTxBuilder, IFetcher, UTxO } from "@meshsdk/core";
import {
  InputUTxO,
  MeshTxInitiator,
  TxConstants,
  contentAddress,
  contentPolicyId,
  contentRegistryRefTxHash,
  contentRegistryRefTxId,
  getScriptCbor,
  getScriptHash,
  oracleAddress,
  oracleValidatorRefTxHash,
  oracleValidatorRefTxId,
  ownershipAddress,
  ownershipPolicyId,
  ownershipRegistryRefTxHash,
  ownershipRegistryRefTxId,
} from "./common";
import { mConStr, parseInlineDatum, stringToHex } from "@sidan-lab/sidan-csl";

export class UserAction extends MeshTxInitiator {
  constructor(mesh: MeshTxBuilder, fetcher: IFetcher, constants: TxConstants) {
    super(mesh, fetcher, constants);
  }

  createContent = async (feeUtxo: InputUTxO, ownerAssetHex: string, contentHash: string, registryNumber = 0) => {
    const oracleUtxo: UTxO[] = await this.fetcher.fetchAddressUTxOs(oracleAddress);
    const contentUtxo: UTxO[] = await this.fetcher.fetchAddressUTxOs(contentAddress);
    const ownershipUtxo: UTxO[] = await this.fetcher.fetchAddressUTxOs(ownershipAddress);
    const registryName = stringToHex(`Registry (${registryNumber})`);
    const { txHash: oracleTxHash, outputIndex: oracleTxId } = oracleUtxo[0].input;
    const { txHash: contentTxHash, outputIndex: contentTxId } = contentUtxo[0].input;
    const { txHash: ownershipTxHash, outputIndex: ownershipTxId } = ownershipUtxo[0].input;
    const contentRegistry = parseInlineDatum<any, any>({ inline_datum: contentUtxo[0].output.plutusData }).fields[1]
      .list;
    const ownershipRegistry = parseInlineDatum<any, any>({ inline_datum: ownershipUtxo[0].output.plutusData }).fields[1]
      .list;
    const ownerAssetClass: [string, string] = [ownerAssetHex.slice(0, 56), ownerAssetHex.slice(56)];

    await this.mesh
      .txIn(feeUtxo.txHash, feeUtxo.outputIndex)
      .spendingPlutusScriptV2()
      .txIn(contentTxHash, contentTxId)
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr(0, [contentHash, ownerAssetClass]))
      .spendingTxInReference(contentRegistryRefTxHash, Number(contentRegistryRefTxId), getScriptHash("ContentRegistry"))
      .txOut(contentAddress, [{ unit: contentPolicyId + registryName, quantity: "1" }])
      .txOutInlineDatumValue(this.getContentDatum([...contentRegistry, contentHash]))
      .spendingPlutusScriptV2()
      .txIn(ownershipTxHash, ownershipTxId)
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr(0, []))
      .spendingTxInReference(
        ownershipRegistryRefTxHash,
        Number(ownershipRegistryRefTxId),
        getScriptHash("OwnershipRegistry")
      )
      .txOut(ownershipAddress, [{ unit: ownershipPolicyId + registryName, quantity: "1" }])
      .txOutInlineDatumValue(this.getOwnershipDatum([...ownershipRegistry, ownerAssetClass]))
      .readOnlyTxInReference(oracleTxHash, oracleTxId)
      .changeAddress(this.constants.walletAddress)
      .txInCollateral(this.constants.collateralUTxO.txHash, this.constants.collateralUTxO.outputIndex)
      .signingKey(this.constants.skey)
      .complete();
    const txHash = await this.signSubmitReset();
    return txHash;
  };
}
