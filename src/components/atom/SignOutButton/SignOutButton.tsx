import { useWallet } from '@meshsdk/react';
import React from 'react'

function SignOutButton():React.JSX.Element {
    const { disconnect, connected } = useWallet();
    
  return (
    <div>
        <button onClick={disconnect}>Sign Out</button>
    </div>
  )
}

export default SignOutButton