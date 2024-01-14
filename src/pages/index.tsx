import Header from "@/components/organism/Header/Header";
import Head from "next/head";
import Image from "next/image";

import { Provider, useDispatch, useSelector } from "react-redux";

import store, { AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { MeshProvider } from "@meshsdk/react";
import { RootReducer } from "@/redux/rootReducer";

export default function Home() {
  const [loading, setLoading] = useState<boolean>(false);
  

  const [loggedIn, setloggedIn] = useState(false)
 
  
  

  return (
    
        <div className=" max-w-7xl">
          <Head>
            <title>Content-Ownership-demo</title>
            <link rel="icon" href="/favicon.ico"></link>
          </Head>

          <Header />

          <div className="flex justify-between items-center bg-yellow-400 border-white border-y border-black py-10 lg:py-0">
            <div className="text-black px-10 space-y-5">
              <h1 className="text-6xl max-w-xl font-serif ">
                <span className="underline decoration-black decoration-4">
                  Medium
                </span>{" "}
                is a place to write, read and connect
              </h1>
              <h2>
                It&apos;s easy and free to post your thinking on any topic and
                connect with millions of readers
              </h2>
            </div>

            <Image
              className="hidden md:inline-flex h-32 lg:h-full"
              src="https://accountabilitylab.org/wp-content/uploads/2020/03/Medium-logo.png"
              width={0}
              height={0}
              sizes="100vw"
              style={{ width: "auto", height: "auto" }}
              alt="medium logo"
            />
          </div>

          {/**Post component */}
        </div>
     
  );
}
