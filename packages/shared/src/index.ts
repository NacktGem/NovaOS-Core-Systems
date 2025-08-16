export const PLATFORM_RATE = 0.12 as const;

export const PALETTES = {
  DarkCore: { bg: "#000003", fg: "#E6E6E6", p1: "#19212A", p2: "#013E43", tier: "FREE" },
  RoseNoir: { bg: "#431D21", fg: "#F8E8EE", p1: "#A33A5B", p2: "#89333F", tier: "FREE" },
  ObsidianBloom: { bg: "#0B0C0F", fg: "#E8EEF3", p1: "#223140", p2: "#5F6D7A", tier: "PAID" },
  GarnetMist: { bg: "#1C0B10", fg: "#FFECEF", p1: "#A33A5B", p2: "#5B1A2C", tier: "PAID" },
  BlueAsh: { bg: "#0E141A", fg: "#EAF2F8", p1: "#1B2A41", p2: "#3E5C76", tier: "PAID" },
  VelvetNight:{ bg: "#0A0A0C", fg: "#F3F0FA", p1: "#2B2537", p2: "#5A4B7A", tier: "PAID" }
} as const;

export type Role =
 | "GODMODE" | "SUPER_ADMIN" | "ADMIN_AGENT" | "ADVISOR" | "MODERATOR"
 | "CREATOR_STANDARD" | "CREATOR_SOVEREIGN" | "VERIFIED_USER" | "GUEST";

export function computeSplit(amountCents: number) {
  const platform = Math.round(amountCents * PLATFORM_RATE);
  const creator = amountCents - platform;
  return { platform, creator };
}
