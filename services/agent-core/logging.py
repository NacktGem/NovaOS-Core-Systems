import json
import logging
from typing import Any, Dict


class JSONLogFormatter(logging.Formatter):
    """A simple JSON log formatter for structured logs."""

    def format(self, record: logging.LogRecord) -> str:
        log_record: Dict[str, Any] = {
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "time": self.formatTime(record, self.datefmt),
        }
        if record.exc_info:
            log_record["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(log_record)


def configure_logging(level: int = logging.INFO) -> None:
    """
    Configure the root logger to output JSON formatted logs to stdout.
    This can be called by any service at startup.
    """
    handler = logging.StreamHandler()
    formatter = JSONLogFormatter()
    handler.setFormatter(formatter)
    root = logging.getLogger()
    root.setLevel(level)
    # Remove any existing handlers to avoid duplicate logs
    for existing in list(root.handlers):
        root.removeHandler(existing)
    root.addHandler(handler)
