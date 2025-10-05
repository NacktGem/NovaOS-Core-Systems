// MessageBubble component

export interface MessageBubbleProps {
  message: {
    id: string;
    user_id: string | null;
    body: string;
    agent_type?: "nova" | "glitch" | "lyra" | "system" | "founder";
  };
  variant?: "blackRose" | "novaOS" | "ghost";
}

// Agent identity configuration with Master Palette accents
const AGENT_CONFIGS = {
  nova: {
    name: "Nova",
    accent: "studios-azureLight-glacierBlue",
    badge: "studios-azureLight-skyBlue",
    description: "Primary orchestrator"
  },
  glitch: {
    name: "Glitch",
    accent: "studios-cryptPink-orchidLush",
    badge: "studios-cryptPink-rosePetal",
    description: "Security & anomaly detection"
  },
  lyra: {
    name: "Lyra",
    accent: "studios-velvetCrimson-burgundy",
    badge: "studios-velvetCrimson-crimsonSilk",
    description: "Content & moderation"
  },
  system: {
    name: "System",
    accent: "studios-cipherCore-cyberBlue",
    badge: "studios-cipherCore-techSilver",
    description: "Automated alerts"
  },
  founder: {
    name: "Founder",
    accent: "blackRose-roseMauve",
    badge: "blackRose-phantom",
    description: "GodMode operator"
  }
};

const variants = {
  blackRose: {
    container: "rounded-2xl border border-blackRose-midnightNavy bg-blackRose-bg px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.45)]",
    header: "mb-1 flex items-center gap-3 text-xs",
    username: "font-semibold",
    badge: "rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
    separator: "h-1 w-1 rounded-full bg-studios-inkSteel-neutral",
    body: "whitespace-pre-line text-sm leading-relaxed text-blackRose-fg",
    metadata: "text-studios-cipherCore-cyberBlue"
  },
  novaOS: {
    container: "rounded-xl border border-novaOS-blueLight bg-white px-4 py-3 shadow-lg",
    header: "mb-1 flex items-center gap-3 text-xs",
    username: "font-semibold",
    badge: "rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
    separator: "h-1 w-1 rounded-full bg-studios-inkSteel-silver",
    body: "whitespace-pre-line text-sm leading-relaxed text-studios-inkSteel-graphite",
    metadata: "text-studios-inkSteel-steel"
  },
  ghost: {
    container: "rounded-lg border border-studios-inkSteel-silver bg-studios-lightboxStudio-pearl px-4 py-3",
    header: "mb-1 flex items-center gap-3 text-xs",
    username: "font-semibold",
    badge: "rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
    separator: "h-1 w-1 rounded-full bg-studios-inkSteel-neutral",
    body: "whitespace-pre-line text-sm leading-relaxed text-studios-inkSteel-graphite",
    metadata: "text-studios-inkSteel-steel"
  }
};

function detectAgentType(userId: string | null, body: string): "nova" | "glitch" | "lyra" | "system" | "founder" {
  if (!userId) return "system";

  // Detect agent type from message patterns or user_id
  const lowerBody = body.toLowerCase();
  const lowerUserId = userId.toLowerCase();

  if (lowerUserId.includes("nova") || lowerBody.includes("[nova]")) return "nova";
  if (lowerUserId.includes("glitch") || lowerBody.includes("[glitch]")) return "glitch";
  if (lowerUserId.includes("lyra") || lowerBody.includes("[lyra]")) return "lyra";
  if (lowerUserId.includes("founder") || lowerUserId.includes("godmode")) return "founder";

  return "system";
}

export const MessageBubble = React.forwardRef<HTMLElement, MessageBubbleProps>(
  ({ message, variant = "blackRose" }, ref) => {
    const styles = variants[variant];
    const agentType = message.agent_type || detectAgentType(message.user_id, message.body);
    const agentConfig = AGENT_CONFIGS[agentType];

    return (
      <article className={styles.container} ref={ref}>
        <header className={styles.header}>
          <span
            className={`${styles.badge} bg-${agentConfig.badge} text-${agentConfig.accent}`}
          >
            {agentConfig.name}
          </span>
          <span className={`${styles.username} text-${agentConfig.accent}`}>
            {agentConfig.description}
          </span>
          <span className={styles.separator} aria-hidden />
          <span className={styles.metadata}>
            Secured via NovaOS relay
          </span>
        </header>
        <p className={styles.body}>
          {message.body}
        </p>
      </article>
    );
  }
);

MessageBubble.displayName = "MessageBubble";
