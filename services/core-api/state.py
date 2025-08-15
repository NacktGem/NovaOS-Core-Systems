import uuid
from typing import Dict

user_flag_cache: Dict[uuid.UUID, Dict[str, bool]] = {}
