'use client'
import { useEffect, useState } from "react";
const API = process.env.CORE_API_BASE!;
type Palette = { key: string; name: string; unlocked: boolean };

export default function Palettes() {
  const [list, setList] = useState<Palette[]>([]);
  useEffect(() => {
    fetch(`${API}/palettes`, { credentials: "include" })
      .then(r => r.json())
      .then(setList);
  }, []);
  return (
    <ul>
      {list.map(p => (
        <li key={p.key}>
          {p.name}-{p.unlocked ? "unlocked" : "locked"}
          {!p.unlocked && (
            <button
              onClick={async () => {
                await fetch(`${API}/payments/unlock-palette`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-PAYMENT-PROOF": "dev",
                  },
                  credentials: "include",
                  body: JSON.stringify({ palette_key: p.key }),
                });
                const r = await fetch(`${API}/palettes`, {
                  credentials: "include",
                });
                setList(await r.json());
              }}
            >
              Unlock
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
