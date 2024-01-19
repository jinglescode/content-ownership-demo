"use client";
import TextField from "@/components/atom/Textfield/Textfield";
import UserIcon from "@/components/atom/UserIcon/UserIcon";
import Header from "@/components/organism/Header/Header";
import React, { useRef, useState } from "react";
import Image from "next/image";
import ImagePreview from "@/components/atom/ImagePreview/ImagePreview";
import Tiptap from "./TipTap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CreateContenthandler from "../api/create-content";
import NewContentHeader from "@/components/organism/NewContentHeader/NewContentHeader";
import { Upload } from "lucide-react";
import { useWallet } from "@meshsdk/react";
import axios from "axios";
import type { Body } from "../api/create-content";
import { UTxO } from "@meshsdk/core";
import { useSelector } from "react-redux";
import { RootReducer } from "@/redux/rootReducer";

function Page(): React.JSX.Element {
  const { wallet, connected } = useWallet();
  const assestHex = useSelector((state: RootReducer) => state.asset);
  
  // Variable initialization
  let walletAddress: String;
  let feeUtxo: UTxO;
  let collateraUtxo: UTxO;
  let ownerAssetHex: String;
  let registryNumber: Number;
  let signTx :String;

  const [loading, setLoading] = useState<boolean>(false);
  /**Add Image */
  const imgRef = useRef<HTMLInputElement | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const addImageHandler = () => {
    imgRef.current?.click();
  };
  const imageHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      const imgURL = URL.createObjectURL(file);
      setImageUrl(imgURL);
    }
  };

  /**Remove Image */
  const removeImage = () => {
    setImage(null);
    setImageUrl(null);
  };

  /**Title */
  const [title, setTitle] = useState<string>("");

  /** Description*/
  const [description, setDescription] = useState<string>("");

  /**Editor */
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write something …",
      }),
      //   CodeBlockLowlight.configure({
      //     lowlight,
      //   }),
    ],
    content: "",
  });

  /**Submit Handler */

  const submitHandler = async () => {
    console.log("submmited, loading...")
    setLoading(true);
    const formData = new FormData();
    const htmlContent = editor?.getHTML();

    formData.append("Title", title);
    formData.append("Description", description);
    formData.append("Content", htmlContent ?? "");
    if (image) {
      formData.append("Image", image);
    }
    try {
      // walletAddress: first item in used address, if no used address, use first item in unused address
      await wallet.getUsedAddresses().then((addresses) => {
        walletAddress = addresses[0];
        console.log("walletAddress:", walletAddress)
      });
      // Get fee UTxO: select an UTxO with >5,000,000 lovelace
      await wallet.getUtxos().then((utxos) => {
        feeUtxo = utxos[0];
        console.log("feeUtxo:", feeUtxo)
      });
      await wallet.getCollateral().then((collateral) => {
        collateraUtxo = collateral[0];
        console.log("collateraUtxo:", collateraUtxo)
      });
      
      // Get assets (NFT to be selected as account)
      // unit: what we need for ownerAssetHex
      ownerAssetHex = assestHex[0].unit;
      registryNumber = 0;
      console.log("formData",formData);

      await axios.post("/api/create-content",{
        walletAddress: walletAddress,
        feeUtxo: feeUtxo,
        collateraUtxo: collateraUtxo,
        ownerAssetHex: ownerAssetHex,
        registryNumber: registryNumber,
        content: formData,
      },).then((res)=>{
        console.log(res)
        setLoading(false);
      }).catch((error)=>{
        console.log(error);
        setLoading(false);
      });
      
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <NewContentHeader
        title={title}
        loading={loading}
        callback={submitHandler}
      />
      <div className="container">
        {/**Adding Image */}
        {imageUrl && (
          <ImagePreview url={imageUrl} removeCallBack={removeImage} />
        )}
        <div className="mt-4">
          <input
            type="file"
            className="hidden"
            ref={imgRef}
            accept="image/png , image/jpeg , image/svg , image/gif , image/jpg , image/webp"
            onChange={imageHandler}
          />
          <Upload
            className="cursor-pointer bg-black"
            onClick={addImageHandler}
          />
        </div>
        {/**Title Input */}
        <div className="mt-4">
          <input
            className=" outline-none h-10 text-2xl  font-bold border-none w-full text-black"
            placeholder="Title.."
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
          />
        </div>
        {/**Description */}
        <div className="mt-4">
          <input
            className=" outline-none h-10 text-xl  font-bold border-none w-full text-black"
            placeholder="Write your short description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
          />
        </div>
        {/** Rich Text Editor */}
        <div className="mt-4 text-black">
          <Tiptap editor={editor} />
        </div>
      </div>
    </div>
  );
}

export default Page;
function aysnc() {
  throw new Error("Function not implemented.");
}
