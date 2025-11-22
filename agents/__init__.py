
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
