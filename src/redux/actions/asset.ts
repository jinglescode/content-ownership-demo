
// asset.ts
export const ADD_ASSET = 'ADD_ASSET';
export const UPDATE_ASSET = 'UPDATE_ASSET';
export const RESET_ASSET = 'RESET_ASSET';

export interface AddAsset {
  type: typeof ADD_ASSET;
  data: any;
}

export interface UpdateAsset {
  type: typeof UPDATE_ASSET;
  data: any;
}

export interface ResetAsset {
  type: typeof RESET_ASSET;
}

export type AssetActionTypes = AddAsset | UpdateAsset | ResetAsset;

export function addasset(data: any): AddAsset {
  return { type: ADD_ASSET, data }
}

export function updateasset(data: any): UpdateAsset {
  return { type: UPDATE_ASSET, data }
}

export function resetasset(): ResetAsset {
  return { type: RESET_ASSET }
}
