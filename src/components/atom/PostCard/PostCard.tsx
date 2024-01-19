import React from "react";


function PostCard({ contentHashHex,content,index }: { contentHashHex: string ,content:Content,index:number}) {
  
  return (
    <div className="container flex flex-col bg-blue-500">
      <div>image</div>
      <div>Post index:{index}</div>
      <div>Description:{content.description}</div>
      <div>Author:{contentHashHex}</div>
    </div>
  );
}

export default PostCard;
