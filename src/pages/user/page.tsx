import TextField from '@/components/atom/Textfield/Textfield'
import Header from '@/components/organism/Header/Header'
import UserProfile from '@/components/organism/UserProfile/UserProfile'
import React from 'react'

function User(walletAddress:String) {
  return (
    <div>
        <Header/>
        <UserProfile/>
    </div>
  )
}

export default User