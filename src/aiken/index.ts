import { Data } from "@meshsdk/core";
import aikenScripts from "./blueprint.json";
import { C } from "./libs";

const toBytes = (hex: string): Uint8Array => {
  if (hex.length % 2 === 0 && /^[0-9A-F]*$/i.test(hex)) return Buffer.from(hex, "hex");

  return Buffer.from(hex, "utf-8");
};

const toPlutusData = (data: Data) => {
  const toPlutusList = (data: Data[]) => {
    const plutusList = C.PlutusList.new();
    data.forEach((element) => {
      plutusList.add(toPlutusData(element));
    });

    return plutusList;
  };

  switch (typeof data) {
    case "string":
      return C.PlutusData.new_bytes(toBytes(data));
    case "number":
      return C.PlutusData.new_integer(C.BigInt.from_str(data.toString()));
    case "object":
      if (data instanceof Array) {
        const plutusList = toPlutusList(data);
        return C.PlutusData.new_list(plutusList);
      } else if (data instanceof Map) {
        const plutusMap = C.PlutusMap.new();
        data.forEach((value, key) => {
          plutusMap.insert(toPlutusData(key), toPlutusData(value));
        });
        return C.PlutusData.new_map(plutusMap);
      } else {
        return C.PlutusData.new_constr_plutus_data(
          C.ConstrPlutusData.new(C.BigNum.from_str(data.alternative.toString()), toPlutusList(data.fields))
        );
      }
  }
};

export const toHex = (bytes: Uint8Array) => Buffer.from(bytes).toString("hex");
export const fromHex = (hex: string) => Buffer.from(hex, "hex");

export function applyDoubleCborEncoding(script: string): string {
  try {
    C.PlutusScript.from_bytes(C.PlutusScript.from_bytes(fromHex(script)).bytes());
    return script;
  } catch (_e) {
    return toHex(C.PlutusScript.new(fromHex(script)).to_bytes());
  }
}

export function applyParamsToScript(plutusScript: string, params: Data[]): string {
  const plutusList = C.PlutusList.new();
  params.forEach((param) => {
    const plutusData = toPlutusData(param);
    plutusList.add(plutusData);
  });
  return toHex(
    C.apply_params_to_plutus_script(
      plutusList,
      C.PlutusScript.from_bytes(fromHex(applyDoubleCborEncoding(plutusScript)))
    ).to_bytes()
  );
}

export function getV2ScriptHash(script: string): string {
  return C.PlutusScript.from_hex_with_version(script, C.Language.new_plutus_v2()).hash().to_hex();
}

export const blueprint = aikenScripts;
