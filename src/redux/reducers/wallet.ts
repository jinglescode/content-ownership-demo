
// wallet.ts
import { Wallet } from '@meshsdk/core';
import { ADD_WALLET, UPDATE_WALLET, RESET_WALLET, WalletActionTypes } from '../actions/wallet';

const initialState:  any[]  = [];

function wallet(state = initialState, action: WalletActionTypes): Wallet[] {
  switch (action.type) {
    case ADD_WALLET:
      return [...state, action.data];
    case UPDATE_WALLET:
      return state.map(item => (item.name === action.data.find(wallet=>wallet.name ===item.name) ? action.data : item));
    case RESET_WALLET:
      return [];
    default:
      return state;
  }
}

export default wallet;
