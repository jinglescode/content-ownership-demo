/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";
import React from "react";
import logo from "./logo.png";
import SignInButton from "../SignInButton/SignInButton";
import { CardanoWallet } from "@meshsdk/react";

function Header() {
  
  return (
    /**
     * Returning the header component of the blog front page*/
    <header className="flex justify-between p-5 max-w-7xl mx-auto"> 
      <div className="items-center space-x-5 flex">
        <Link href="/">
          <Image
            className=" object-contain cursor-pointer"
            src={logo}
            alt=""
            height={50}
            width={50}
          />
        </Link>
        <div className=" md:inline-flex  items-center space-x-5 hidden">
          <h3 className="text-black">About </h3>
          <h3 className="text-black">Contact</h3>
          <h3 className="text-white bg-green-600 rounded-full px-4 py-1">
            Follow
          </h3>
        </div>
      </div>

      <div className="flex items-center space-x-5 text-green-600">
        <SignInButton/>
        <CardanoWallet />
        <h3 className=" border px-4 py-1 rounded-full border-green-600">Get Started</h3>
      </div>
    </header>
  );
}

export default Header;
