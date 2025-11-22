#!/usr/bin/env python3
"""
NovaOS Agent System Validator
Tests all agents and provides readiness status
"""
import json
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

from core.registry import AgentRegistry
from agents.nova.agent import NovaAgent
from agents.glitch.agent import GlitchAgent
from agents.lyra.agent import LyraAgent
from agents.velora.agent import VeloraAgent
from agents.audita.agent import AuditaAgent
from agents.echo.agent import EchoAgent
from agents.riven.agent import RivenAgent

def test_agent(registry, agent_name, command, args=None):
    """Test a specific agent command"""
    if args is None:
        args = {}
    
    try:
        response = registry.call(agent_name, {
            'command': command,
            'args': args
        })
        return {
            'success': response.success,
            'output': response.output,
            'error': response.error,
            'job_id': response.job_id
        }
    except Exception as e:
        return {
            'success': False,
            'output': None,
            'error': str(e),
            'job_id': None
        }

def main():
    print("🚀 NovaOS Agent System Validation\n")
    
    # Create registry and register agents
    registry = AgentRegistry()
    agents_config = {
        'glitch': GlitchAgent(),
        'lyra': LyraAgent(), 
        'velora': VeloraAgent(),
        'audita': AuditaAgent(),
        'echo': EchoAgent(),
        'riven': RivenAgent()
    }
    
    for name, agent in agents_config.items():
        registry.register(name, agent)
    
    nova = NovaAgent(registry)
    
    # Test cases for each agent
    test_cases = {
        'glitch': [
            ('hash_file', {'path': 'README.md'}),
            ('sandbox_check', {}),
        ],
        'lyra': [
            ('create_prompt', {'type': 'writing'}),
            ('generate_lesson', {'topic': 'Python', 'grade': '5th'}),
        ],
        'velora': [
            ('generate_report', {'data': {'users': 100, 'revenue': 5000}}),
            ('ad_generate', {'product': 'NovaOS', 'audience': 'developers'}),
        ],
        'audita': [
            ('gdpr_scan', {'data': 'Contact user@example.com for support'}),
            ('tax_report', {'income': [1000, 2000], 'expenses': [500, 300]}),
        ],
        'echo': [
            ('send_message', {'message': 'Test message'}),
            ('broadcast', {'message': 'System ready', 'recipients': ['admin']}),
        ],
        'riven': [
            ('generate_protocol', {'title': 'Emergency', 'steps': ['Assess', 'Act']}),
            ('bugout_map', {'start': [40.7128, -74.0060], 'end': [41.8781, -87.6298]}),
        ]
    }
    
    results = {}
    total_tests = 0
    passed_tests = 0
    
    for agent_name, tests in test_cases.items():
        print(f"🧠 Testing {agent_name.upper()} Agent:")
        agent_results = []
        
        for command, args in tests:
            total_tests += 1
            result = test_agent(registry, agent_name, command, args)
            
            status = "✅" if result['success'] else "❌"
            print(f"  {status} {command}: {result['success']}")
            
            if result['success']:
                passed_tests += 1
            else:
                print(f"     Error: {result['error']}")
            
            agent_results.append({
                'command': command,
                'args': args,
                'result': result
            })
        
        results[agent_name] = agent_results
        print()
    
    # Summary
    success_rate = (passed_tests / total_tests) * 100
    print(f"📊 SUMMARY:")
    print(f"   Total Tests: {total_tests}")
    print(f"   Passed: {passed_tests}")
    print(f"   Failed: {total_tests - passed_tests}")
    print(f"   Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("   🟢 AGENT SYSTEM: EXCELLENT")
    elif success_rate >= 75:
        print("   🟡 AGENT SYSTEM: GOOD")
    else:
        print("   🔴 AGENT SYSTEM: NEEDS WORK")
    
    # Save detailed results
    with open('agent_validation_results.json', 'w') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Detailed results saved to: agent_validation_results.json")
    
    return success_rate >= 75

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)