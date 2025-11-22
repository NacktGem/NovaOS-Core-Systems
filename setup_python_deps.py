# NovaOS Python Dependencies Setup
# This script sets up all Python dependencies for production deployment

import sys
import subprocess
import os
from pathlib import Path


def install_python_deps():
    """Install all Python dependencies for NovaOS production deployment."""

    # Core requirements
    core_deps = [
        "fastapi>=0.104.0",
        "uvicorn[standard]>=0.24.0",
        "psycopg2-binary>=2.9.7",
        "redis>=4.6.0",
        "sqlalchemy>=2.0.21",
        "alembic>=1.12.1",
        "pydantic>=2.5.0",
        "python-jose[cryptography]>=3.3.0",
        "passlib[bcrypt]>=1.7.4",
        "python-multipart>=0.0.6",
        "aiofiles>=23.2.1",
        "httpx>=0.25.0",
    ]

    # Forensics and security dependencies
    forensics_deps = [
        "volatility3>=2.5.0",
        "yara-python>=4.3.1",
        "pefile>=2023.2.7",
        "pycryptodome>=3.18.0",
        "dpkt>=1.9.8",
        "scapy>=2.4.5",
        "capstone>=5.0.1",
        "unicorn>=2.0.1",
        "keystone-engine>=0.9.2",
    ]

    # Mobile forensics
    mobile_deps = [
        "adb-shell>=0.4.4",
        "pyidevice>=1.4.0",
        "frida-tools>=12.2.1",
    ]

    # OSINT and analysis
    osint_deps = [
        "requests>=2.31.0",
        "beautifulsoup4>=4.12.2",
        "python-whois>=0.8.0",
        "shodan>=1.29.1",
        "tqdm>=4.66.1",
        "tabulate>=0.9.0",
    ]

    # Development and testing
    dev_deps = [
        "pytest>=8.2",
        "pytest-asyncio>=0.23",
        "black>=24.8",
        "mypy>=1.10",
    ]

    all_deps = core_deps + forensics_deps + mobile_deps + osint_deps + dev_deps

    print("Installing NovaOS Python dependencies...")

    # Install everything
    for dep in all_deps:
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", dep], check=True)
            print(f"✓ Installed {dep}")
        except subprocess.CalledProcessError as e:
            print(f"✗ Failed to install {dep}: {e}")

    print("\nInstallation complete!")

    # Create path setup
    setup_python_path()


def setup_python_path():
    """Set up Python path for NovaOS components."""

    project_root = Path(__file__).parent

    # Create Python path configuration
    python_path_setup = f'''
import sys
import os
from pathlib import Path

# Add project root to Python path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "agents"))
sys.path.insert(0, str(PROJECT_ROOT / "services"))
sys.path.insert(0, str(PROJECT_ROOT / "src"))

# Set environment variables for production
os.environ.setdefault("NOVAOS_ENV", "production")
os.environ.setdefault("PYTHONPATH", ":".join(sys.path))
'''

    # Write path setup to agents directory
    (project_root / "agents" / "__init__.py").write_text(python_path_setup)
    (project_root / "services" / "__init__.py").write_text("# NovaOS Services")

    print("✓ Python path configuration created")


if __name__ == "__main__":
    install_python_deps()
