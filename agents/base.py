# core/base.py

import abc
from typing import Any, Dict

class BaseAgent(abc.ABC):
    """
    Abstract base class for all NovaOS agents.
    Ensures all agents follow a common interface.
    """

    def __init__(self, name: str):
        self.name = name

    @abc.abstractmethod
    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute agent logic. Must be implemented by subclasses.
        Args:
            input_data: A dictionary containing task-specific input.
        Returns:
            A dictionary containing the agent's structured output.
        """
        pass

    def log_result(self, result: Dict[str, Any]):
        """
        Save the result to file and/or console.
        Override this for custom logging logic per agent.
        """
        import json, os
        from datetime import datetime

        log_dir = f"logs/{self.name}"
        os.makedirs(log_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        with open(f"{log_dir}/{timestamp}.json", "w") as f:
            json.dump(result, f, indent=2)

        print(f"[{self.name}] Result logged at {log_dir}/{timestamp}.json")