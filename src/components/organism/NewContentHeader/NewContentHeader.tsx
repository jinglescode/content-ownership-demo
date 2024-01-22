import Image from "next/image";
import React from "react";

import Link from "next/link";
import Icon from "@/components/atom/icon/Icon";

export default function NewContentHeader({
  title,
  loading,
  callback,
}: {
  title: string;
  loading: boolean;
  callback: () => Promise<void>;
}) {
  return (
    <div className="border-b">
      <div className="container flex justify-between items-center p-1.5">
        <div className="flex space-x-2 text-black items-center">
          <Link href="/">
            <Icon />
          </Link>

          <p>{title}</p>
        </div>
        <button
          className="bg-black rounded-lg p-1 cursor-pointer"
          disabled={loading}
          onClick={callback}
        >
          {loading ? "Saving.." : "Save"}
        </button>
      </div>
    </div>
  );
}
