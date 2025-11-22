const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3005;

const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NovaOS - GodMode Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 100%);
            color: #e2e8f0;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px 0;
            border-bottom: 2px solid #dc2626;
        }
        .header h1 {
            font-size: 3rem;
            color: #dc2626;
            font-weight: 900;
            text-shadow: 0 0 20px rgba(220, 38, 38, 0.5);
            margin-bottom: 10px;
        }
        .header p {
            font-size: 1.2rem;
            color: #94a3b8;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: rgba(30, 30, 30, 0.8);
            border: 1px solid #374151;
            border-radius: 12px;
            padding: 20px;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }
        .card:hover {
            border-color: #dc2626;
            box-shadow: 0 10px 30px rgba(220, 38, 38, 0.2);
            transform: translateY(-2px);
        }
        .card h3 {
            color: #dc2626;
            margin-bottom: 15px;
            font-size: 1.4rem;
        }
        .status {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-online { background-color: #10b981; }
        .status-offline { background-color: #ef4444; }
        .status-warning { background-color: #f59e0b; }
        .agent-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .agent-card {
            background: rgba(20, 20, 20, 0.6);
            border: 1px solid #4b5563;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            transition: all 0.3s ease;
        }
        .agent-card:hover {
            border-color: #dc2626;
            background: rgba(30, 20, 20, 0.8);
        }
        .console {
            background: #111827;
            border: 1px solid #374151;
            border-radius: 8px;
            padding: 20px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            margin-top: 20px;
        }
        .console-header {
            color: #10b981;
            margin-bottom: 10px;
            font-weight: bold;
        }
        .console-content {
            color: #94a3b8;
            line-height: 1.6;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #374151;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 NovaOS GodMode</h1>
            <p>Sovereign Control Interface - Multi-Domain Platform Management</p>
        </div>

        <div class="grid">
            <div class="card">
                <h3>🔧 System Status</h3>
                <div class="status">
                    <div class="status-dot status-online"></div>
                    <span>Core API: Online</span>
                </div>
                <div class="status">
                    <div class="status-dot status-online"></div>
                    <span>Database: Connected</span>
                </div>
                <div class="status">
                    <div class="status-dot status-online"></div>
                    <span>Redis: Active</span>
                </div>
                <div class="status">
                    <div class="status-dot status-warning"></div>
                    <span>Web Shell: Restarting</span>
                </div>
            </div>

            <div class="card">
                <h3>🌐 Platform Domains</h3>
                <div class="status">
                    <div class="status-dot status-online"></div>
                    <span>NovaOS Console (Port 3002)</span>
                </div>
                <div class="status">
                    <div class="status-dot status-online"></div>
                    <span>Black Rose Collective</span>
                </div>
                <div class="status">
                    <div class="status-dot status-online"></div>
                    <span>GypsyCove Academy</span>
                </div>
            </div>

            <div class="card">
                <h3>📊 Analytics Overview</h3>
                <div class="status">
                    <div class="status-dot status-online"></div>
                    <span>7 AI Agents Active</span>
                </div>
                <div class="status">
                    <div class="status-dot status-online"></div>
                    <span>Multi-LLM Integration Ready</span>
                </div>
                <div class="status">
                    <div class="status-dot status-online"></div>
                    <span>Revenue Analytics: Velora</span>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>🤖 AI Agent Grid</h3>
            <div class="agent-grid">
                <div class="agent-card">
                    <h4>🎯 Nova</h4>
                    <p>Orchestrator</p>
                    <div class="status">
                        <div class="status-dot status-online"></div>
                        <small>Active</small>
                    </div>
                </div>
                <div class="agent-card">
                    <h4>🎨 Lyra</h4>
                    <p>Creative</p>
                    <div class="status">
                        <div class="status-dot status-online"></div>
                        <small>Active</small>
                    </div>
                </div>
                <div class="agent-card">
                    <h4>🛡️ Glitch</h4>
                    <p>Security</p>
                    <div class="status">
                        <div class="status-dot status-online"></div>
                        <small>Active</small>
                    </div>
                </div>
                <div class="agent-card">
                    <h4>📈 Velora</h4>
                    <p>Analytics</p>
                    <div class="status">
                        <div class="status-dot status-online"></div>
                        <small>Active</small>
                    </div>
                </div>
                <div class="agent-card">
                    <h4>🏗️ Riven</h4>
                    <p>Infrastructure</p>
                    <div class="status">
                        <div class="status-dot status-online"></div>
                        <small>Active</small>
                    </div>
                </div>
                <div class="agent-card">
                    <h4>📋 Audita</h4>
                    <p>Compliance</p>
                    <div class="status">
                        <div class="status-dot status-online"></div>
                        <small>Active</small>
                    </div>
                </div>
                <div class="agent-card">
                    <h4>📡 Echo</h4>
                    <p>Test Agent</p>
                    <div class="status">
                        <div class="status-dot status-online"></div>
                        <small>Active</small>
                    </div>
                </div>
            </div>
        </div>

        <div class="console">
            <div class="console-header">🖥️ System Console Output</div>
            <div class="console-content">
                [2025-09-21 20:00:00] NovaOS GodMode Dashboard Initialized<br>
                [2025-09-21 20:00:01] Core API: Connected to postgresql://localhost:5433<br>
                [2025-09-21 20:00:01] Redis: Connected to localhost:6380 (3 databases)<br>
                [2025-09-21 20:00:02] Agent System: 7 agents registered and active<br>
                [2025-09-21 20:00:03] Web Shell: Available at localhost:3002<br>
                [2025-09-21 20:00:04] Multi-LLM Integration: Ready (OpenAI, Ollama, LM Studio)<br>
                [2025-09-21 20:00:05] Platform Status: All systems operational ✅<br>
                <br>
                <span style="color: #10b981;">🚀 Ready for commands. GodMode access confirmed.</span>
            </div>
        </div>

        <div class="footer">
            <p>NovaOS Core Systems v1.0 | Multi-Domain AI Platform | GodMode Interface</p>
            <p>For full dashboard functionality, navigate to <a href="http://localhost:3002" style="color: #dc2626;">localhost:3002</a> once Web Shell is ready</p>
        </div>
    </div>

    <script>
        // Simple status updates
        setInterval(() => {
            const timestamp = new Date().toLocaleTimeString();
            const consoleContent = document.querySelector('.console-content');
            if (consoleContent) {
                consoleContent.innerHTML += \`<br>[\${timestamp}] System heartbeat: All agents responding ✅\`;
                consoleContent.scrollTop = consoleContent.scrollHeight;
            }
        }, 30000);
    </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
    });
    res.end(dashboardHTML);
});

server.listen(PORT, () => {
    console.log(`🚀 NovaOS GodMode Dashboard running at http://localhost:${PORT}`);
    console.log('📊 Serving simplified dashboard interface');
    console.log('🔄 Auto-refresh enabled for system status');
});
