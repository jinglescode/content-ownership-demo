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

function Page(): React.JSX.Element {
  const [loading, setLoading] = useState<boolean>(false)
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
  const [title, setTitle] = useState<string>("")

  /** Description*/
  const [description, setDescription] = useState<string>("")

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
   const submitHandler = ()=>{
    setLoading(true)
    const formData = new FormData
    const htmlContent = editor?.getHTML()
    formData.append("Title", title);
    formData.append("Description", description );
    formData.append("Content", htmlContent ??"")
     if(image){
      formData.append("Image",image)
     }
     
   }
  return (
    <div>
      <NewContentHeader title={title} loading={loading} callback={submitHandler}/>
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
          <Upload className="cursor-pointer bg-black" onClick={addImageHandler}/>
         
          
        </div>
        {/**Title Input */}
        <div className="mt-4">
          <input
            className=" outline-none h-10 text-2xl  font-bold border-none w-full text-black"
            placeholder="Title.."
            value={title}
            onChange={(event )=>{setTitle(event.target.value)}}
          />
        </div>
        {/**Description */}
        <div className="mt-4">
          <input
            className=" outline-none h-10 text-xl  font-bold border-none w-full text-black"
            placeholder="Write your short description"
            value={description}
            onChange={(event )=>{setDescription(event.target.value)}}
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
