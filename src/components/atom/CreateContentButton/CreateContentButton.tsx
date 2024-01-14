import Link from 'next/link'
import React from 'react'

function CreateContentButton() {
  return (
    <Link href="/NewContent/page" className='px-5'>
        <h3>Create Content</h3>
         </Link>
  )
}

export default CreateContentButton