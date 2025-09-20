import React from "react";

export interface RoomSelectorProps {
  rooms: Array<{
    id: string;
    name: string;
    private: boolean;
  }>;
  activeRoom: string | null;
  onRoomChange: (_roomId: string) => void;
  variant?: "blackRose" | "novaOS" | "ghost";
  title?: string;
}

// Agent room configuration with Master Palette accents
const AGENT_ROOM_CONFIGS = {
  nova: {
    accent: "studios-azureLight-glacierBlue",
    badge: "studios-azureLight-skyBlue",
    icon: "●"
  },
  glitch: {
    accent: "studios-cryptPink-orchidLush",
    badge: "studios-cryptPink-rosePetal",
    icon: "◆"
  },
  lyra: {
    accent: "studios-velvetCrimson-burgundy",
    badge: "studios-velvetCrimson-crimsonSilk",
    icon: "♦"
  },
  system_alerts: {
    accent: "studios-cipherCore-cyberBlue",
    badge: "studios-cipherCore-techSilver",
    icon: "▲"
  },
  admin_room: {
    accent: "blackRose-roseMauve",
    badge: "blackRose-phantom",
    icon: "■"
  },
  family_room: {
    accent: "novaOS-blueDark",
    badge: "novaOS-lavender",
    icon: "♥"
  },
  tutor_room: {
    accent: "studios-inkSteel-steel",
    badge: "studios-inkSteel-silver",
    icon: "◇"
  }
};

function getAgentConfig(roomId: string) {
  return AGENT_ROOM_CONFIGS[roomId as keyof typeof AGENT_ROOM_CONFIGS] || AGENT_ROOM_CONFIGS.system_alerts;
}

const variants = {
  blackRose: {
    container: "w-72 border-r border-blackRose-midnightNavy bg-blackRose-trueBlack",
    header: "px-5 py-6",
    title: "text-xs uppercase tracking-widest text-blackRose-roseMauve",
    subtitle: "mt-2 text-lg font-semibold text-blackRose-fg",
    nav: "space-y-1 px-3 pb-6",
    roomActive: "border-blackRose-roseMauve bg-blackRose-midnightNavy",
    roomInactive: "border-transparent bg-transparent hover:border-blackRose-bloodBrown hover:bg-blackRose-bg",
    roomName: "text-sm font-medium text-blackRose-fg",
    roomMeta: "text-[11px] uppercase tracking-wide text-studios-inkSteel-neutral",
    roomIcon: "mr-3 text-lg",
    emptyState: "rounded-lg border border-blackRose-midnightNavy bg-blackRose-bg px-4 py-3 text-sm text-studios-inkSteel-silver"
  },
  novaOS: {
    container: "w-72 border-r border-novaOS-blueLight bg-novaOS-blueLight",
    header: "px-5 py-6",
    title: "text-xs uppercase tracking-widest text-novaOS-blueDark",
    subtitle: "mt-2 text-lg font-semibold text-studios-inkSteel-graphite",
    nav: "space-y-1 px-3 pb-6",
    roomActive: "border-novaOS-blueDark bg-white",
    roomInactive: "border-transparent bg-transparent hover:border-novaOS-lavender hover:bg-white/50",
    roomName: "text-sm font-medium text-studios-inkSteel-graphite",
    roomMeta: "text-[11px] uppercase tracking-wide text-studios-inkSteel-steel",
    roomIcon: "mr-3 text-lg",
    emptyState: "rounded-lg border border-novaOS-lavender bg-white px-4 py-3 text-sm text-studios-inkSteel-steel"
  },
  ghost: {
    container: "w-72 border-r border-studios-inkSteel-silver bg-studios-lightboxStudio-pearl",
    header: "px-5 py-6",
    title: "text-xs uppercase tracking-widest text-studios-inkSteel-steel",
    subtitle: "mt-2 text-lg font-semibold text-studios-inkSteel-graphite",
    nav: "space-y-1 px-3 pb-6",
    roomActive: "border-studios-inkSteel-steel bg-white",
    roomInactive: "border-transparent bg-transparent hover:border-studios-inkSteel-silver hover:bg-white/50",
    roomName: "text-sm font-medium text-studios-inkSteel-graphite",
    roomMeta: "text-[11px] uppercase tracking-wide text-studios-inkSteel-steel",
    roomIcon: "mr-3 text-lg",
    emptyState: "rounded-lg border border-studios-inkSteel-silver bg-white px-4 py-3 text-sm text-studios-inkSteel-steel"
  }
};

export const RoomSelector = React.forwardRef<HTMLElement, RoomSelectorProps>(
  ({ rooms, activeRoom, onRoomChange, variant = "blackRose", title = "Chat" }, ref) => {
    const styles = variants[variant];

    return (
      <aside className={styles.container} ref={ref}>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <h2 className={styles.subtitle}>Agent Channels</h2>
        </div>
        <nav className={styles.nav}>
          {rooms.map((room) => {
            const agentConfig = getAgentConfig(room.id);
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => onRoomChange(room.id)}
                className={`flex w-full items-center rounded-xl border px-4 py-3 text-left transition ${room.id === activeRoom ? styles.roomActive : styles.roomInactive
                  }`}
              >
                <span
                  className={`${styles.roomIcon} text-${agentConfig.accent}`}
                  aria-hidden
                >
                  {agentConfig.icon}
                </span>
                <div className="flex-1">
                  <span className={styles.roomName}>{room.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={styles.roomMeta}>
                      {room.private ? "Private" : "Public"}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-${agentConfig.badge} text-${agentConfig.accent}`}>
                      Agent
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
          {rooms.length === 0 && (
            <p className={styles.emptyState}>
              No agent rooms available. Check system configuration.
            </p>
          )}
        </nav>
      </aside>
    );
  }
);

RoomSelector.displayName = "RoomSelector";
