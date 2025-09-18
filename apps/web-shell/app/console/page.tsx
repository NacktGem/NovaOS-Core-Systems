import { redirect } from "next/navigation";

const NOVAOS_FALLBACK = "https://novaos.blackrosecollective.studio";

export default function ConsoleRedirect() {
  const target = process.env.NOVAOS_BASE_URL ?? NOVAOS_FALLBACK;
  redirect(target);
}
