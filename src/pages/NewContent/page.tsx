"use client";
import TextField from "@/components/atom/Textfield/Textfield";
import UserIcon from "@/components/atom/UserIcon/UserIcon";
import Header from "@/components/organism/Header/Header";
import React, { useRef, useState } from "react";
import Image from "next/image";
import ImagePreview from "@/components/atom/ImagePreview/ImagePreview";

function Page(): React.JSX.Element {
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

  return (
    <div>
      <Header />
      <div className="container">
        {/**Adding Image */}
        {imageUrl && <ImagePreview url={imageUrl} removeCallBack={removeImage}/>}
        <div className="mt-4">
          <input
            type="file"
            className="hidden"
            ref={imgRef}
            accept="image/png , image/jpeg , image/svg , image/gif , image/jpg , image/webp"
            onChange={imageHandler}
          />
          <Image
            className="cursor-pointer"
            src=""
            alt="addImage"
            onClick={addImageHandler}
          />
        </div>
        {/**Title Input */}
        <div className="mt-4">
          <input
            className=" outline-none h-10 text-2xl  font-bold border-none w-full text-black"
            placeholder="Title.."
          />
        </div>
        {/**Description */}
        <div className="mt-4">
          <input
            className=" outline-none h-10 text-xl  font-bold border-none w-full text-black"
            placeholder="Write your short description"
          />
        </div>
      </div>
      <h3 className="text-black text-center">New Content</h3>
      <TextField label="Title" />
      <TextField label="Author" />
      <TextField label="Description" />
    </div>
  );
}

export default Page;
