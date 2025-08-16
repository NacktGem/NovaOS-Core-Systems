'use client'
import { useState } from 'react'
const API = process.env.CORE_API_BASE!
export default function Login() {
  const [msg, setMsg] = useState(" ");
  return (
    <form
      onSubmit={async e => {
        e.preventDefault();
        const form = e.currentTarget;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;
        const res = await fetch(`${API}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        setMsg(res.ok ? "ok" : "fail");
      }}
    >
      <input name="email" />
      <input name="password" type="password" />
      <button type="submit">login</button>
      <div>{msg}</div>
    </form>
  );
}
