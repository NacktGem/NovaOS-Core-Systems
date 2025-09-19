export type ServiceDescriptor = {
  name: string;
  label: string;
  description: string;
};

export const SERVICE_CATALOG: ServiceDescriptor[] = [
  {
    name: 'core-api',
    label: 'Core API',
    description: 'Authentication, RBAC, consent, analytics',
  },
  {
    name: 'echo',
    label: 'Echo Relay',
    description: 'WebSocket and broadcast relay',
  },
  {
    name: 'glitch',
    label: 'Glitch Forensics',
    description: 'Threat detection and anti-leak forensics',
  },
  {
    name: 'audita',
    label: 'Audita Compliance',
    description: 'DMCA, consent vault, legal automation',
  },
  {
    name: 'velora',
    label: 'Velora Analytics',
    description: 'Revenue intelligence and campaign automation',
  },
  {
    name: 'lyra',
    label: 'Lyra Creative',
    description: 'Curriculum, prompts, botanical guidance',
  },
  {
    name: 'riven',
    label: 'Riven Guardian',
    description: 'Parental safety, medical triage, survival ops',
  },
];

export type HealthResponse = {
  services: Array<{
    name: string;
    label: string;
    description: string;
    online: boolean;
    latency_ms: number | null;
    endpoint: string | null;
    version?: string | null;
    commit?: string | null;
    checked_at: string;
    error?: string | null;
  }>;
  timestamp: string;
};
