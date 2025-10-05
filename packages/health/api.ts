import { NextRequest, NextResponse } from 'next/server';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: string;
  details?: Record<string, any>;
}

interface PlatformHealth {
  platform: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  version: string;
  services: ServiceHealth[];
  agents?: AgentHealth[];
  lastUpdated: string;
}

interface AgentHealth {
  name: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  lastActivity: string;
  responseTime: number;
  capabilities: string[];
}

// Platform-specific health checks
const PLATFORM_SERVICES: Record<string, string[]> = {
  novaos: ['core-api', 'redis', 'agents', 'godmode'],
  blackrose: ['web-shell', 'creator-api', 'analytics', 'velora'],
  gypsycove: ['education-api', 'content-moderation', 'family-chat', 'lyra'],
};

const CORE_AGENTS = ['lyra', 'nova', 'glitch', 'velora', 'vega', 'aria', 'sage'];

async function checkServiceHealth(serviceName: string): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    // Mock service health checks - in production these would be real health endpoints
    const serviceEndpoints: Record<string, string> = {
      'core-api': 'http://localhost:8760/api/health',
      redis: 'redis://localhost:6379',
      'web-shell': 'http://localhost:3000/api/health',
      godmode: 'http://localhost:3002/api/health',
      'education-api': 'http://localhost:3001/api/health',
    };

    const endpoint = serviceEndpoints[serviceName];
    if (!endpoint) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    // For HTTP services
    if (endpoint.startsWith('http')) {
      const response = await fetch(endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          name: serviceName,
          status: 'healthy',
          responseTime,
          lastCheck: new Date().toISOString(),
          details: data,
        };
      } else {
        return {
          name: serviceName,
          status: 'degraded',
          responseTime,
          lastCheck: new Date().toISOString(),
          details: { httpStatus: response.status },
        };
      }
    }

    // For Redis and other services, we'll simulate the check
    return {
      name: serviceName,
      status: 'healthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      details: { simulated: true },
    };
  } catch (error) {
    return {
      name: serviceName,
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        simulated: true,
      },
    };
  }
}

async function checkAgentHealth(agentName: string): Promise<AgentHealth> {
  const startTime = Date.now();

  try {
    const response = await fetch(`http://localhost:8760/api/agents/${agentName}/health`, {
      method: 'GET',
      headers: {
        AGENT_SHARED_TOKEN: process.env.AGENT_SHARED_TOKEN || '',
        INTERNAL_TOKEN: process.env.INTERNAL_TOKEN || '',
      },
      signal: AbortSignal.timeout(3000),
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      return {
        name: agentName,
        status: data.status || 'active',
        lastActivity: data.lastActivity || new Date().toISOString(),
        responseTime,
        capabilities: data.capabilities || [],
      };
    } else {
      return {
        name: agentName,
        status: 'error',
        lastActivity: new Date().toISOString(),
        responseTime,
        capabilities: [],
      };
    }
  } catch (error) {
    return {
      name: agentName,
      status: 'offline',
      lastActivity: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      capabilities: [],
    };
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get('platform') || 'all';
  const includeAgents = searchParams.get('agents') === 'true';

  try {
    if (platform === 'all') {
      // Get health for all platforms
      const platforms = Object.keys(PLATFORM_SERVICES);
      const healthData = await Promise.all(
        platforms.map(async (platformName) => {
          const services = PLATFORM_SERVICES[platformName];
          const serviceHealthPromises = services.map((service) => checkServiceHealth(service));
          const serviceHealthResults = await Promise.all(serviceHealthPromises);

          // Determine overall platform health
          const healthyServices = serviceHealthResults.filter((s) => s.status === 'healthy').length;
          const totalServices = serviceHealthResults.length;
          const healthPercentage = (healthyServices / totalServices) * 100;

          let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
          if (healthPercentage >= 90) {
            overallStatus = 'healthy';
          } else if (healthPercentage >= 70) {
            overallStatus = 'degraded';
          } else {
            overallStatus = 'unhealthy';
          }

          // Mock uptime and version data
          const uptime = Math.floor(Math.random() * 86400) + 86400; // 1-2 days
          const version = '1.0.0';

          const platformHealth: PlatformHealth = {
            platform: platformName,
            status: overallStatus,
            uptime,
            version,
            services: serviceHealthResults,
            lastUpdated: new Date().toISOString(),
          };

          // Add agent health for NovaOS
          if (includeAgents && platformName === 'novaos') {
            const agentHealthPromises = CORE_AGENTS.map((agent) => checkAgentHealth(agent));
            const agentHealthResults = await Promise.all(agentHealthPromises);
            platformHealth.agents = agentHealthResults;
          }

          return platformHealth;
        })
      );

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        platforms: healthData,
        summary: {
          totalPlatforms: healthData.length,
          healthyPlatforms: healthData.filter((p) => p.status === 'healthy').length,
          degradedPlatforms: healthData.filter((p) => p.status === 'degraded').length,
          unhealthyPlatforms: healthData.filter((p) => p.status === 'unhealthy').length,
        },
      });
    } else {
      // Get health for specific platform
      const services = PLATFORM_SERVICES[platform];
      if (!services) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unknown platform',
          },
          { status: 400 }
        );
      }

      const serviceHealthPromises = services.map((service) => checkServiceHealth(service));
      const serviceHealthResults = await Promise.all(serviceHealthPromises);

      // Determine overall platform health
      const healthyServices = serviceHealthResults.filter((s) => s.status === 'healthy').length;
      const totalServices = serviceHealthResults.length;
      const healthPercentage = (healthyServices / totalServices) * 100;

      let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
      if (healthPercentage >= 90) {
        overallStatus = 'healthy';
      } else if (healthPercentage >= 70) {
        overallStatus = 'degraded';
      } else {
        overallStatus = 'unhealthy';
      }

      const platformHealth: PlatformHealth = {
        platform,
        status: overallStatus,
        uptime: Math.floor(Math.random() * 86400) + 86400,
        version: '1.0.0',
        services: serviceHealthResults,
        lastUpdated: new Date().toISOString(),
      };

      // Add agent health for NovaOS
      if (includeAgents && platform === 'novaos') {
        const agentHealthPromises = CORE_AGENTS.map((agent) => checkAgentHealth(agent));
        const agentHealthResults = await Promise.all(agentHealthPromises);
        platformHealth.agents = agentHealthResults;
      }

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        platform: platformHealth,
      });
    }
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST endpoint for updating service health (for internal use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, service, status, details } = body;

    // Validate shared token for internal updates
    const sharedToken = request.headers.get('AGENT_SHARED_TOKEN');
    if (sharedToken !== process.env.AGENT_SHARED_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // In a real implementation, this would update a health status cache
    // For now, we'll just log the update
    console.log(`Health update for ${platform}/${service}:`, { status, details });

    return NextResponse.json({
      success: true,
      message: 'Health status updated',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update health status',
      },
      { status: 500 }
    );
  }
}

// Simple health endpoint for this service itself
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
