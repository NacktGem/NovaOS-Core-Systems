import { cookies } from "next/headers";
const API = process.env.CORE_API_BASE!;
type Palette = { key: string; name: string; unlocked: boolean };

export default async function Palettes() {
  const res = await fetch(`${API}/palettes`, {
    headers: { cookie: cookies().toString() },
    cache: "no-store",
  });
  const data: Palette[] = await res.json();
  return (
    <ul>
      {data.map(p => (
        <li key={p.key}>
          {p.name}-{p.unlocked ? "unlocked" : "locked"}
        </li>
      ))}
    </ul>
  );
}
