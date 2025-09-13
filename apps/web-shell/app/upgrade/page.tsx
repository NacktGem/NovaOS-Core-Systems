'use client'
const API = process.env.CORE_API_BASE!
export default function Upgrade(){
  return <button onClick={async()=>{await fetch(`${API}/payments/upgrade-tier`,{method:'POST',headers:{'Content-Type':'application/json','X-PAYMENT-PROOF':'dev'},credentials:'include',body:JSON.stringify({target_tier:'CREATOR_SOVEREIGN'})});}}>Upgrade to Sovereign</button>
}
