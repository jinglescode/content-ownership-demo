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
  const assetHex = useSelector((state: RootReducer) => state.asset);
  const walletAddress = useSelector(
    (state: RootReducer) => state.walletAddress
  );
  const feeUtxo = useSelector((state: RootReducer) => state.feeUtxo);
  const collateralUtxo = useSelector(
    (state: RootReducer) => state.collateralUtxo
  );
  // Variable initialization

  let ownerAssetHex: String;
  let registryNumber: Number;

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
    console.log("submitted, loading...");
    setLoading(true);

    const htmlContent = editor?.getHTML();

    /**Content Dict */
    let content = {
      title: title,
      description: description,
      content: htmlContent,
      image: image,
    };

    try {
      console.log("walletAddress", walletAddress[0]);
      console.log("feeUtxo", feeUtxo[0]);
      console.log("collateralUtxo", collateralUtxo[0]);

      // Get assets (NFT to be selected as account)
      // unit: what we need for ownerAssetHex
      ownerAssetHex = assetHex[0].unit;
      console.log("ownerAssetHex", ownerAssetHex);

      registryNumber = 0;
      console.log("registryNumber", registryNumber);
      console.log("Content", content);

      const res = await axios.post("/api/create-content", {
        walletAddress: walletAddress[0],
        feeUtxo: feeUtxo[0],
        collateralUtxo: collateralUtxo[0],
        ownerAssetHex: ownerAssetHex,
        registryNumber: registryNumber,
        content: content,
      });
      const rawTx = res.data.rawTx;

      const signedTx = await wallet.signTx(rawTx, true);
      const txHash = await wallet.submitTx(signedTx);
      console.log("txHash", txHash);
      alert("submit success");
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
