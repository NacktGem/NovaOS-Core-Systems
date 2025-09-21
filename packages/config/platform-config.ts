/**
 * Unified Configuration System for NovaOS Multi-Platform Architecture
 *
 * This configuration system provides centralized settings management
 * across NovaOS Console, Black Rose Collective, and GypsyCove Academy.
 */

export interface PlatformConfig {
  // Platform Identity
  platform: {
    id: 'novaos' | 'blackrose' | 'gypsycove';
    name: string;
    version: string;
    port: number;
    domain?: string;
    description: string;
  };

  // Database Configuration
  database: {
    redis: {
      host: string;
      port: number;
      database: number; // Namespace isolation: 0=NovaOS, 1=BlackRose, 2=GypsyCove
      password?: string;
    };
    core_api_url: string;
  };

  // Authentication & Security
  auth: {
    jwt_secret: string;
    session_timeout: number; // minutes
    require_2fa: boolean;
    allowed_origins: string[];
    api_rate_limit: {
      requests_per_minute: number;
      burst_limit: number;
    };
  };

  // Agent System
  agents: {
    shared_token: string;
    internal_token: string;
    enabled_agents: string[];
    llm: {
      default_provider: 'openai' | 'ollama' | 'lmstudio';
      providers: {
        openai?: {
          api_key: string;
          base_url?: string;
          model: string;
        };
        ollama?: {
          base_url: string;
          model: string;
        };
        lmstudio?: {
          base_url: string;
          model: string;
        };
      };
    };
  };

  // Platform-Specific Features
  features: {
    // NovaOS specific
    godmode?: {
      enabled: boolean;
      admin_only: boolean;
      real_time_monitoring: boolean;
    };

    // Black Rose specific
    creator?: {
      analytics_enabled: boolean;
      revenue_tracking: boolean;
      content_monetization: boolean;
      subscription_tiers: string[];
    };

    // GypsyCove specific
    education?: {
      content_moderation: boolean;
      parental_controls: boolean;
      age_verification: boolean;
      screen_time_limits: boolean;
      family_chat: boolean;
    };
  };

  // Cross-Platform Integration
  integration: {
    unified_analytics: boolean;
    cross_platform_navigation: boolean;
    shared_user_sessions: boolean;
    health_monitoring: boolean;
  };

  // Development & Deployment
  development: {
    debug_mode: boolean;
    hot_reload: boolean;
    mock_data: boolean;
    log_level: 'error' | 'warn' | 'info' | 'debug';
  };
}

// Default configurations for each platform
const PLATFORM_DEFAULTS: Record<string, Partial<PlatformConfig>> = {
  novaos: {
    platform: {
      id: 'novaos',
      name: 'NovaOS Console',
      version: '1.0.0',
      port: 3002,
      description: 'Master control interface for NovaOS ecosystem',
    },
    database: {
      redis: { database: 0 },
    },
    features: {
      godmode: {
        enabled: true,
        admin_only: true,
        real_time_monitoring: true,
      },
    },
    agents: {
      enabled_agents: ['nova', 'glitch', 'lyra', 'velora', 'vega', 'aria', 'sage'],
    },
  },
  blackrose: {
    platform: {
      id: 'blackrose',
      name: 'Black Rose Collective',
      version: '1.0.0',
      port: 3000,
      description: 'Creator platform with advanced analytics and revenue optimization',
    },
    database: {
      redis: { database: 1 },
    },
    features: {
      creator: {
        analytics_enabled: true,
        revenue_tracking: true,
        content_monetization: true,
        subscription_tiers: ['basic', 'premium', 'elite'],
      },
    },
    agents: {
      enabled_agents: ['velora', 'nova', 'aria'],
    },
  },
  gypsycove: {
    platform: {
      id: 'gypsycove',
      name: 'GypsyCove Academy',
      version: '1.0.0',
      port: 3001,
      description: 'Family-friendly educational platform with comprehensive safety features',
    },
    database: {
      redis: { database: 2 },
    },
    features: {
      education: {
        content_moderation: true,
        parental_controls: true,
        age_verification: true,
        screen_time_limits: true,
        family_chat: true,
      },
    },
    agents: {
      enabled_agents: ['lyra', 'sage', 'nova'],
    },
  },
};

// Base configuration shared across all platforms
const BASE_CONFIG: Partial<PlatformConfig> = {
  database: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
    core_api_url: process.env.CORE_API_URL || 'http://localhost:8760',
  },
  auth: {
    jwt_secret: process.env.JWT_SECRET || 'fallback-dev-secret',
    session_timeout: 1440, // 24 hours
    require_2fa: false,
    allowed_origins: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    api_rate_limit: {
      requests_per_minute: 60,
      burst_limit: 10,
    },
  },
  agents: {
    shared_token: process.env.AGENT_SHARED_TOKEN || '',
    internal_token: process.env.INTERNAL_TOKEN || '',
    enabled_agents: [],
    llm: {
      default_provider: 'ollama',
      providers: {
        openai: {
          api_key: process.env.OPENAI_API_KEY || '',
          model: 'gpt-4',
        },
        ollama: {
          base_url: process.env.OLLAMA_URL || 'http://localhost:11434',
          model: 'llama2',
        },
        lmstudio: {
          base_url: process.env.LMSTUDIO_URL || 'http://localhost:1234',
          model: 'local-model',
        },
      },
    },
  },
  integration: {
    unified_analytics: true,
    cross_platform_navigation: true,
    shared_user_sessions: true,
    health_monitoring: true,
  },
  development: {
    debug_mode: process.env.NODE_ENV !== 'production',
    hot_reload: process.env.NODE_ENV === 'development',
    mock_data: process.env.USE_MOCK_DATA === 'true',
    log_level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
  },
};

/**
 * Load configuration for a specific platform
 */
export function loadPlatformConfig(platformId: string): PlatformConfig {
  const platformDefaults = PLATFORM_DEFAULTS[platformId] || {};

  // Deep merge base config with platform-specific defaults
  const config = deepMerge(BASE_CONFIG, platformDefaults) as PlatformConfig;

  // Override with environment variables if available
  if (process.env.PLATFORM_PORT) {
    config.platform.port = parseInt(process.env.PLATFORM_PORT);
  }

  if (process.env.PLATFORM_DOMAIN) {
    config.platform.domain = process.env.PLATFORM_DOMAIN;
  }

  return config;
}

/**
 * Get cross-platform shared configuration
 */
export function getSharedConfig(): Pick<
  PlatformConfig,
  'database' | 'auth' | 'agents' | 'integration'
> {
  const config = loadPlatformConfig('novaos'); // Use NovaOS as base
  return {
    database: config.database,
    auth: config.auth,
    agents: config.agents,
    integration: config.integration,
  };
}

/**
 * Validate configuration completeness
 */
export function validateConfig(config: PlatformConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!config.platform.id) errors.push('Platform ID is required');
  if (!config.platform.name) errors.push('Platform name is required');
  if (!config.platform.port) errors.push('Platform port is required');

  if (!config.database.redis.host) errors.push('Redis host is required');
  if (!config.database.core_api_url) errors.push('Core API URL is required');

  if (!config.auth.jwt_secret) errors.push('JWT secret is required');
  if (!config.agents.shared_token) errors.push('Agent shared token is required');
  if (!config.agents.internal_token) errors.push('Internal token is required');

  // Validate LLM provider configuration
  const defaultProvider = config.agents.llm.default_provider;
  const providerConfig = config.agents.llm.providers[defaultProvider];
  if (!providerConfig) {
    errors.push(`Configuration missing for default LLM provider: ${defaultProvider}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Deep merge utility function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Configuration loading utilities for different platforms
 */
export const NovaOSConfig = () => loadPlatformConfig('novaos');
export const BlackRoseConfig = () => loadPlatformConfig('blackrose');
export const GypsyCoveConfig = () => loadPlatformConfig('gypsycove');

/**
 * Runtime configuration access
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: PlatformConfig;

  private constructor(platformId: string) {
    this.config = loadPlatformConfig(platformId);
  }

  static getInstance(platformId: string): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(platformId);
    }
    return ConfigManager.instance;
  }

  get<K extends keyof PlatformConfig>(key: K): PlatformConfig[K] {
    return this.config[key];
  }

  getAgent(agentName: string): boolean {
    return this.config.agents.enabled_agents.includes(agentName);
  }

  getLLMConfig() {
    return this.config.agents.llm;
  }

  isDevelopment(): boolean {
    return this.config.development.debug_mode;
  }

  isFeatureEnabled(feature: string): boolean {
    const features = this.config.features;
    if (!features) return false;

    // Check nested feature flags
    for (const category of Object.values(features)) {
      if (category && typeof category === 'object' && category[feature as keyof typeof category]) {
        return true;
      }
    }

    return false;
  }
}
