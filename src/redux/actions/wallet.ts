import { Wallet } from "@meshsdk/core";

// wallet.ts
export const ADD_WALLET = 'ADD_WALLET';
export const UPDATE_WALLET = 'UPDATE_WALLET';
export const RESET_WALLET = 'RESET_WALLET';


//limited the type of the wallet array
export interface AddWallet {
  type: typeof ADD_WALLET;
  data: Array<Wallet[]>;
}

//
export interface UpdateWallet {
  type: typeof UPDATE_WALLET;
  data: Array<Wallet[]>;
}

export interface ResetWallet {
  type: typeof RESET_WALLET;
}

export type WalletActionTypes = AddWallet | UpdateWallet | ResetWallet;

export function addwallet(data: Array<Wallet[]>): AddWallet {
  return { type: ADD_WALLET, data }
}

export function updatewallet(data: Array<Wallet[]>): UpdateWallet {
  return { type: UPDATE_WALLET, data }
}

export function resetwallet(): ResetWallet {
  return { type: RESET_WALLET }
}
