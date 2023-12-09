import { MeshTxBuilder, IFetcher, UTxO, Data } from "@meshsdk/core";
import {
  InputUTxO,
  MeshTxInitiator,
  TxConstants,
  contentAddress,
  contentPolicyId,
  contentRegistryRefTxHash,
  contentRegistryRefTxId,
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
import { ContentRegistryDatum, OwnershipRegistryDatum } from "./type";

export type UpdateContent = {
  feeUtxo: UTxO;
  ownerTokenUtxo: UTxO;
  collateralUtxo: UTxO;
  walletAddress: string;
  registryNumber: number;
  newContentHashHex: string;
  contentNumber: number;
};

export class UserAction extends MeshTxInitiator {
  constructor(mesh: MeshTxBuilder, fetcher: IFetcher, constants: TxConstants) {
    super(mesh, fetcher, constants);
  }

  // TODO: Input user's address
  createContent = async (feeUtxo: InputUTxO, ownerAssetHex: string, contentHashHex: string, registryNumber = 0) => {
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
    const newContentRegistry = this.insertContentRegistry(contentUtxo[0].output.plutusData!, contentHashHex);
    const newOwnershipRegistry = this.insertOwnershipRegistry(ownershipUtxo[0].output.plutusData!, ownerAssetClass);

    await this.mesh
      .txIn(feeUtxo.txHash, feeUtxo.outputIndex)
      .spendingPlutusScriptV2()
      .txIn(contentTxHash, contentTxId)
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr(0, [contentHashHex, ownerAssetClass]))
      .spendingTxInReference(contentRegistryRefTxHash, contentRegistryRefTxId, getScriptHash("ContentRegistry"))
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
      .changeAddress(this.constants.walletAddress) // TODO: Change to user's address
      .txInCollateral(this.constants.collateralUTxO.txHash, this.constants.collateralUTxO.outputIndex) // TODO: Change to user's address
      .complete();
    const txHex = this.mesh.completeSigning();
    return txHex;
  };

  updateContent = async ({
    feeUtxo,
    ownerTokenUtxo,
    collateralUtxo,
    walletAddress,
    registryNumber,
    newContentHashHex,
    contentNumber,
  }: UpdateContent) => {
    const registryTokenNameHex = stringToHex(`Registry (${registryNumber})`);

    const contentUtxo: UTxO[] = await this.fetcher.fetchAddressUTxOs(
      contentAddress,
      contentPolicyId + registryTokenNameHex
    );
    const ownershipUtxo: UTxO[] = await this.fetcher.fetchAddressUTxOs(
      ownershipAddress,
      ownershipPolicyId + registryTokenNameHex
    );
    const oracleUtxo = await this.fetcher.fetchAddressUTxOs(oracleAddress, oraclePolicyId);
    console.log("Content", contentUtxo);
    console.log("Ownership", ownershipUtxo);
    console.log("Oracle", oracleUtxo);
    const { txHash: oracleTxHash, outputIndex: oracleTxId } = oracleUtxo[0].input;
    const { txHash: contentTxHash, outputIndex: contentTxId } = contentUtxo[0].input;
    const { txHash: ownershipTxHash, outputIndex: ownershipTxId } = ownershipUtxo[0].input;
    const newContentRegistry = this.updateContentRegistry(
      contentUtxo[0].output.plutusData!,
      contentNumber,
      newContentHashHex
    );

    console.log("Content In", contentTxHash, contentTxId);

    await this.mesh
      // .txIn(feeUtxo.input.txHash, feeUtxo.input.outputIndex, feeUtxo.output.amount, walletAddress)
      // .txIn(ownerTokenUtxo.input.txHash, ownerTokenUtxo.input.outputIndex, ownerTokenUtxo.output.amount, walletAddress)
      .txIn(feeUtxo.input.txHash, feeUtxo.input.outputIndex)
      .txIn(ownerTokenUtxo.input.txHash, ownerTokenUtxo.input.outputIndex)
      .spendingPlutusScriptV2()
      .txIn(contentTxHash, contentTxId)
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr(1, [newContentHashHex, contentNumber]))
      .spendingTxInReference(contentRegistryRefTxHash, contentRegistryRefTxId)
      .txOut(contentAddress, [{ unit: contentPolicyId + registryTokenNameHex, quantity: "1" }])
      .txOutInlineDatumValue(newContentRegistry)
      .readOnlyTxInReference(oracleTxHash, oracleTxId)
      .readOnlyTxInReference(ownershipTxHash, ownershipTxId)
      .changeAddress(walletAddress)
      // .txInCollateral(
      //   collateralUtxo.input.txHash,
      //   collateralUtxo.input.outputIndex,
      //   feeUtxo.output.amount,
      //   walletAddress
      // )
      .txInCollateral(collateralUtxo.input.txHash, collateralUtxo.input.outputIndex)
      .complete();
    const txBody = this.mesh.completeSigning();
    return txBody;
  };

  transferContent = async (txInHash: string, txInId: number, registryNumber: number) => {
    // TODO
    // const registryTokenNameHex = stringToHex(`Registry (${registryNumber})`);
    // const scriptUtxos = await this.fetcher.fetchAddressUTxOs(contentAddress, contentPolicyId + registryTokenNameHex);
    // const oracleUtxo = await this.fetcher.fetchAddressUTxOs(oracleAddress, oraclePolicyId);
    // const { txHash: oracleTxHash, outputIndex: oracleTxId } = oracleUtxo[0].input;
    // const { txHash: validatorTxHash, outputIndex: validatorTxId } = scriptUtxos[0].input;
    // await this.mesh
    //   .txIn(txInHash, txInId)
    //   .spendingPlutusScriptV2()
    //   .txIn(validatorTxHash, validatorTxId)
    //   .txInInlineDatumPresent()
    //   .txInRedeemerValue(mConStr(2, []))
    //   .txInScript(getScriptCbor("ContentRegistry"))
    //   .mintPlutusScriptV2()
    //   .mint(-1, contentPolicyId, registryTokenNameHex)
    //   .mintTxInReference(contentTokenRefTxHash, Number(contentTokenRefTxId))
    //   .mintRedeemerValue(mConStr1([]))
    //   .readOnlyTxInReference(oracleTxHash, oracleTxId)
    //   .changeAddress(this.constants.walletAddress)
    //   .txInCollateral(this.constants.collateralUTxO.txHash, this.constants.collateralUTxO.outputIndex)
    //   .requiredSignerHash(stopKey)
    //   .signingKey(this.constants.skey)
    //   .complete();
    // const txBody = this.mesh.completeSigning();
    return "";
  };

  private insertContentRegistry = (plutusData: string, newContentHash: string): Data => {
    const contentRegistry = parseInlineDatum<any, ContentRegistryDatum>({
      inline_datum: plutusData,
    }).fields[1].list.map((plutusBytes) => plutusBytes.bytes);
    const newContentRegistry = this.getContentDatum([...contentRegistry, newContentHash]);
    return newContentRegistry;
  };

  private insertOwnershipRegistry = (plutusData: string, ownerAssetClass: [string, string]): Data => {
    const ownershipRegistry = parseInlineDatum<any, OwnershipRegistryDatum>({
      inline_datum: plutusData,
    }).fields[1].list.map((plutusBytesArray): [string, string] => [
      plutusBytesArray.list[0].bytes,
      plutusBytesArray.list[1].bytes,
    ]);
    const newContentRegistry = this.getOwnershipDatum([...ownershipRegistry, ownerAssetClass]);
    return newContentRegistry;
  };

  private updateContentRegistry = (plutusData: string, contentNumber: number, newContentHash: string): Data => {
    const contentRegistry = parseInlineDatum<any, ContentRegistryDatum>({
      inline_datum: plutusData,
    }).fields[1].list.map((plutusBytes) => plutusBytes.bytes);
    contentRegistry[contentNumber] = newContentHash;
    const newContentRegistry = this.getContentDatum(contentRegistry);
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
