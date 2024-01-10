import { addaccount } from "@/redux/actions/account";
import { addwallet, updatewallet } from "@/redux/actions/wallet";
import { RootReducer } from "@/redux/rootReducer";
import { AppDispatch } from "@/redux/store";
import { BrowserWallet, Wallet } from "@meshsdk/core";
import { useWallet } from "@meshsdk/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

function ConnectButton() {
  const { connect, connected, disconnect } = useWallet();
  const [cardanoWallet, setcardanoWallet] = useState<Array<Wallet>>([]);

  const wallet = useSelector((state: RootReducer) => state.wallet);
  const account = useSelector((state: RootReducer) => state.account);
  
  const dispatch: AppDispatch = useDispatch();
  useEffect(() => {
    
    setcardanoWallet(BrowserWallet.getInstalledWallets());
    dispatch(
      wallet.length > 0
        ? updatewallet(BrowserWallet.getInstalledWallets())
        : addwallet(BrowserWallet.getInstalledWallets())
    );
    
  }, [dispatch, wallet.length]);

  useEffect(() => {
    dispatch(addaccount)
  }, [connected])
  

  const connectWallet = async (walletName: string) => {
    try {
      
      //seems eternl wallet cannot connect by this call
      await connect(walletName);

    } catch (error) {
      console.log(error);
    }
  };

  return (
    !connected && (
      <>
        {cardanoWallet.map((wallet) => (
          <button
            key={wallet.name}
            className=" text-black"
            onClick={() => connectWallet(wallet.name)}
          >
            Connect to {wallet.name}
          </button>
        ))}
      </>
    )
  );
}

export default ConnectButton;
