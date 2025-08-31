import { cookies } from 'next/headers'
const API = process.env.CORE_API_BASE!
export default async function Me(){
  const res = await fetch(`${API}/me`,{headers:{cookie:cookies().toString()},cache:'no-store'})
  if(!res.ok) return <div>error</div>
  const data = await res.json()
  return (
    <div>
      {data.role === 'GODMODE' && <div className="bg-red-800 text-white p-2">GodMode Active — logging bypassed</div>}
      <pre>{JSON.stringify(data,null,2)}</pre>
    </div>
  )
}
