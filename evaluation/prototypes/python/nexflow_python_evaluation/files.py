"""Read-only, bounded input selection. Component checks are not an OS sandbox."""
import os
import stat
from pathlib import Path
from .model import safe_locator

class InputFailure(Exception):
    def __init__(self, code="NF-DISCOVERY-UNSAFE-SOURCE"):
        super().__init__(code)
        self.code = code

class LocalInputs:
    def __init__(self, root: str):
        try:
            if not isinstance(root, str) or not root:
                raise ValueError()
            self.root = Path(root).resolve(strict=True)
            if not stat.S_ISDIR(self.root.lstat().st_mode):
                raise ValueError()
        except (OSError, ValueError, RuntimeError, TypeError):
            raise InputFailure() from None

    def _path(self, locator: str) -> Path:
        if safe_locator(locator) == "<redacted-source>":
            raise InputFailure("NF-DISCOVERY-OUTSIDE-ROOT")
        current = self.root
        for part in locator.split("/"):
            current = current / part
            if stat.S_ISLNK(current.lstat().st_mode):
                raise InputFailure()
        return current

    def exists(self, locator: str) -> bool:
        if locator not in ("project.yaml", "project.yml"):
            raise InputFailure()
        try:
            (self.root / locator).lstat()
            return True
        except FileNotFoundError:
            return False
        except OSError:
            raise InputFailure() from None

    def read(self, locator: str) -> str:
        descriptor = None
        try:
            file = self._path(locator)
            if file.suffix not in (".yaml", ".yml") or not stat.S_ISREG(file.lstat().st_mode):
                raise InputFailure()
            descriptor = os.open(file, os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0) | getattr(os, "O_NONBLOCK", 0))
            info = os.fstat(descriptor)
            if not stat.S_ISREG(info.st_mode):
                raise InputFailure()
            limit = 1024 * 1024
            if info.st_size > limit:
                raise InputFailure("NF-DISCOVERY-LIMIT-EXCEEDED")
            chunks, length = [], 0
            while length <= limit:
                chunk = os.read(descriptor, min(65536, limit + 1 - length))
                if not chunk:
                    break
                chunks.append(chunk)
                length += len(chunk)
            if length > limit:
                raise InputFailure("NF-DISCOVERY-LIMIT-EXCEEDED")
            return b"".join(chunks).decode("utf-8", errors="strict")
        except InputFailure:
            raise
        except (OSError, UnicodeError, ValueError, TypeError):
            raise InputFailure() from None
        finally:
            if descriptor is not None:
                os.close(descriptor)
