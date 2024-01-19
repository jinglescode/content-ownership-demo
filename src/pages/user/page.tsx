import SelectAssestButton from "@/components/organism/SelectAssestButton/SelectAssestButton";
import TextField from "@/components/atom/Textfield/Textfield";
import Header from "@/components/organism/Header/Header";
import UserProfile from "@/components/organism/UserProfile/UserProfile";
import React from "react";

function User(walletAddress: String) {
  return (
    <div>
      <Header />
      {/* {<UserProfile />} */}
      <SelectAssestButton/>
    </div>
  );
}

export default User;
