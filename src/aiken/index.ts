import { Data } from "@meshsdk/core";
import aikenScripts from "./blueprint.json";
import { C } from "./libs";

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

export function applyParamsToScript(plutusScript: string, params: Array<Data>): string {
  const plutusData = C.PlutusData.from_json(JSON.stringify(params), 1).to_bytes();
  return toHex(
    C.apply_params_to_plutus_script(
      C.PlutusList.from_bytes(plutusData),
      C.PlutusScript.from_bytes(fromHex(applyDoubleCborEncoding(plutusScript)))
    ).to_bytes()
  );
}

export const blueprint = aikenScripts;
