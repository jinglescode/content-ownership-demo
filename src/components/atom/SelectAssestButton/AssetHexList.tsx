import { addasset, updateasset } from "@/redux/actions/asset";
import { RootReducer } from "@/redux/rootReducer";
import { AppDispatch } from "@/redux/store";
import { AssetExtended, Wallet } from "@meshsdk/core";
import { useWallet } from "@meshsdk/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

function AssetHexList({callback}:{callback:VoidFunction}) {
  const { wallet, connected } = useWallet();
  const [assest, setAssest] = useState<AssetExtended[]>();
  const dispatch: AppDispatch = useDispatch();
  const assestHex = useSelector((state: RootReducer) => state.asset);
  const [selected, setSelected] = useState<boolean>(false)
  useEffect(() => {
    if (connected) {
      wallet
        .getAssets()
        .then((assets) => {
          setAssest(assets);
        })
        
          
        
    }
  }, [connected]);

  return (
    connected &&
    assest && !selected && (
      <>
        {assest.map((assest) => (
          <button
            key={assest.unit}
            className=" text-black py-1  text-start"
            onClick={() => {
              /**Set the assest Hex to reducer */
              assestHex.length > 0
                ? dispatch(updateasset(assest))
                : dispatch(addasset(assest));
                setSelected(true);
                callback();
            }}
          >
            {assest.unit}
          </button>
        ))}
      </>
    )
  );
}

export default AssetHexList;
