#!/usr/bin/env python3
"""
NovaOS Infrastructure Completeness Check
Analyzes missing Docker configs, services, and provides action plan
"""
import os
from pathlib import Path

def check_dockerfiles():
    """Check which services are missing Dockerfiles"""
    services_dir = Path('services')
    services = [d for d in services_dir.iterdir() if d.is_dir() and d.name != '.gitkeep']
    
    dockerfile_status = {}
    for service in services:
        dockerfile_path = service / 'Dockerfile'
        dockerfile_status[service.name] = dockerfile_path.exists()
    
    return dockerfile_status

def check_compose_integration():
    """Check which services are integrated in docker-compose.yml"""
    compose_file = Path('docker-compose.yml')
    if not compose_file.exists():
        return {}
    
    content = compose_file.read_text()
    
    # List of expected agent services
    agent_services = ['nova-orchestrator', 'glitch', 'lyra', 'velora', 'audita', 'riven']
    
    integration_status = {}
    for service in agent_services:
        # Check if service is defined in compose file
        integration_status[service] = service in content
    
    return integration_status

def check_service_implementations():
    """Check which services have main.py or equivalent implementation"""
    services_dir = Path('services')
    
    implementation_status = {}
    for service_dir in services_dir.iterdir():
        if not service_dir.is_dir():
            continue
            
        service_name = service_dir.name
        
        # Check for main implementation files
        main_files = [
            service_dir / 'app' / 'main.py',
            service_dir / 'main.py',
            service_dir / 'app.py'
        ]
        
        has_implementation = any(f.exists() and f.stat().st_size > 100 for f in main_files)
        implementation_status[service_name] = has_implementation
    
    return implementation_status

def generate_action_plan():
    """Generate prioritized action plan"""
    
    print("🔍 NovaOS Infrastructure Completeness Analysis\n")
    
    # Check all components
    dockerfile_status = check_dockerfiles()
    compose_status = check_compose_integration()
    implementation_status = check_service_implementations()
    
    print("📋 SERVICE STATUS MATRIX:")
    print("=" * 60)
    print(f"{'Service':<20} {'Implementation':<15} {'Dockerfile':<12} {'Compose':<10}")
    print("-" * 60)
    
    all_services = set(dockerfile_status.keys()) | set(compose_status.keys()) | set(implementation_status.keys())
    
    priority_services = []
    for service in sorted(all_services):
        impl = "✅" if implementation_status.get(service, False) else "❌"
        docker = "✅" if dockerfile_status.get(service, False) else "❌"
        compose = "✅" if compose_status.get(service, False) else "❌"
        
        print(f"{service:<20} {impl:<15} {docker:<12} {compose:<10}")
        
        # Calculate priority (missing implementation = highest priority)
        if not implementation_status.get(service, False):
            priority_services.append((service, "HIGH - Missing Implementation"))
        elif not dockerfile_status.get(service, False):
            priority_services.append((service, "MEDIUM - Missing Dockerfile"))
        elif not compose_status.get(service, False):
            priority_services.append((service, "LOW - Missing Compose Integration"))
    
    print("\n🎯 PRIORITIZED ACTION PLAN:")
    print("=" * 50)
    
    if not priority_services:
        print("✅ All infrastructure components are complete!")
        return
    
    phase = 1
    current_priority = None
    
    for service, priority in priority_services:
        priority_level = priority.split(" - ")[0]
        
        if priority_level != current_priority:
            print(f"\n📌 PHASE {phase}: {priority_level} PRIORITY")
            current_priority = priority_level
            phase += 1
        
        print(f"   • {service}: {priority.split(' - ')[1]}")
    
    print("\n🛠️  DETAILED IMPLEMENTATION STEPS:")
    print("=" * 40)
    
    # Generate specific commands for missing pieces
    missing_implementations = [s for s, p in priority_services if "Missing Implementation" in p]
    missing_dockerfiles = [s for s, p in priority_services if "Missing Dockerfile" in p]
    missing_compose = [s for s, p in priority_services if "Missing Compose" in p]
    
    if missing_implementations:
        print("\n1️⃣  CREATE MISSING SERVICE IMPLEMENTATIONS:")
        for service in missing_implementations:
            print(f"   mkdir -p services/{service}/app")
            print(f"   # Create services/{service}/app/main.py with FastAPI app")
            print(f"   # Create services/{service}/pyproject.toml with dependencies")
            print()
    
    if missing_dockerfiles:
        print("2️⃣  CREATE MISSING DOCKERFILES:")
        for service in missing_dockerfiles:
            print(f"   # Create services/{service}/Dockerfile")
            print(f"   # Base on existing pattern from services/core-api/Dockerfile")
            print()
    
    if missing_compose:
        print("3️⃣  UPDATE DOCKER-COMPOSE.YML:")
        for service in missing_compose:
            print(f"   # Add {service} service definition")
            print(f"   # Include health checks and dependencies")
            print()
    
    print("4️⃣  TESTING & VALIDATION:")
    print("   make up                    # Test full stack")
    print("   ./validate_agents.py      # Test agent functionality")
    print("   make down                 # Clean up")
    
    print("\n🚀 NEXT STEPS FOR AI INTEGRATION:")
    print("   • Add LLM model loading (GGUF/HuggingFace)")
    print("   • Implement embedding storage and retrieval")
    print("   • Add conversational interfaces to agents")
    print("   • Create intelligent routing in Nova")
    print("   • Add learning and memory capabilities")

if __name__ == "__main__":
    generate_action_plan()