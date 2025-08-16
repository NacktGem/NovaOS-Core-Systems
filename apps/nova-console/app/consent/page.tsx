'use client'
import { useState } from 'react'
const AUDITA = 'http://localhost:8770'
export default function Consent(){
  const [msg,setMsg]=useState('')
  return (
    <form onSubmit={async e=>{e.preventDefault();const fd=new FormData(e.target as HTMLFormElement);const res=await fetch(`${AUDITA}/consent/upload`,{method:'POST',body:fd});setMsg(res.ok?'ok':'fail')}} encType="multipart/form-data">
      <input name="user_id" placeholder="user id"/>
      <input name="kind" placeholder="kind"/>
      <input type="file" name="file"/>
      <button type="submit">upload</button>
      <div>{msg}</div>
    </form>
  )
}
