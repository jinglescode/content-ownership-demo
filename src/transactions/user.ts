import { MeshTxBuilder, IFetcher, UTxO, Data } from "@meshsdk/core";
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
  oraclePolicyId,
  oracleValidatorRefTxHash,
  oracleValidatorRefTxId,
  ownershipAddress,
  ownershipPolicyId,
  ownershipRegistryRefTxHash,
  ownershipRegistryRefTxId,
} from "./common";
import { BuiltinByteString, mConStr, parseInlineDatum, stringToHex } from "@sidan-lab/sidan-csl";
import { toPlutusData } from "@/aiken";
import { ContentRegistryDatum, OwnershipRegistryDatum } from "./type";

export class UserAction extends MeshTxInitiator {
  constructor(mesh: MeshTxBuilder, fetcher: IFetcher, constants: TxConstants) {
    super(mesh, fetcher, constants);
  }

  createContent = async (feeUtxo: InputUTxO, ownerAssetHex: string, contentHash: string, registryNumber = 0) => {
    const registryName = stringToHex(`Registry (${registryNumber})`);
    const oracleUtxo: UTxO[] = await this.fetcher.fetchAddressUTxOs(oracleAddress, oraclePolicyId);
    const contentUtxo: UTxO[] = await this.fetcher.fetchAddressUTxOs(contentAddress, contentPolicyId + registryName);
    const ownershipUtxo: UTxO[] = await this.fetcher.fetchAddressUTxOs(
      ownershipAddress,
      ownershipPolicyId + registryName
    );
    const { txHash: oracleTxHash, outputIndex: oracleTxId } = oracleUtxo[0].input;
    const { txHash: contentTxHash, outputIndex: contentTxId } = contentUtxo[0].input;
    const { txHash: ownershipTxHash, outputIndex: ownershipTxId } = ownershipUtxo[0].input;
    const ownerAssetClass: [string, string] = [ownerAssetHex.slice(0, 56), ownerAssetHex.slice(56)];
    const newContentRegistry = this.updateContentRegistry(contentUtxo[0].output.plutusData!, contentHash);
    const newOwnershipRegistry = this.updateOwnershipRegistry(ownershipUtxo[0].output.plutusData!, ownerAssetClass);

    await this.mesh
      .txIn(feeUtxo.txHash, feeUtxo.outputIndex)
      .spendingPlutusScriptV2()
      .txIn(contentTxHash, contentTxId)
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr(0, [contentHash, ownerAssetClass]))
      .spendingTxInReference(contentRegistryRefTxHash, Number(contentRegistryRefTxId), getScriptHash("ContentRegistry"))
      .txOut(contentAddress, [{ unit: contentPolicyId + registryName, quantity: "1" }])
      .txOutInlineDatumValue(newContentRegistry)
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
      .txOutInlineDatumValue(newOwnershipRegistry)
      .readOnlyTxInReference(oracleTxHash, oracleTxId)
      .changeAddress(this.constants.walletAddress)
      .txInCollateral(this.constants.collateralUTxO.txHash, this.constants.collateralUTxO.outputIndex)
      .signingKey(this.constants.skey) // TODO: Remove the signing key if it is preferred to be used by user from frontend
      .complete();
    const txHash = await this.signSubmitReset(); // TODO: Use completeSigning to build the TxHex for frontend signing instead
    return txHash;
  };

  private updateContentRegistry = (plutusData: string, newContentHash: string): Data => {
    const contentRegistry = parseInlineDatum<any, ContentRegistryDatum>({
      inline_datum: plutusData,
    }).fields[1].list.map((plutusBytes) => plutusBytes.bytes);
    const newContentRegistry = this.getContentDatum([...contentRegistry, newContentHash]);
    return newContentRegistry;
  };

  private updateOwnershipRegistry = (plutusData: string, ownerAssetClass: [string, string]): Data => {
    const ownershipRegistry = parseInlineDatum<any, OwnershipRegistryDatum>({
      inline_datum: plutusData,
    }).fields[1].list.map((plutusBytesArray): [string, string] => [
      plutusBytesArray.list[0].bytes,
      plutusBytesArray.list[1].bytes,
    ]);
    const newContentRegistry = this.getOwnershipDatum([...ownershipRegistry, ownerAssetClass]);
    return newContentRegistry;
  };
}
