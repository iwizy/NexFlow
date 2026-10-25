"""Trusted native Python entry shim; no alternate backend or executable input."""
import runpy
import sys
from pathlib import Path
from windows_paths import enable_container_paths

enable_container_paths()

site = Path(sys.argv[1]).resolve(strict=True)
entry = Path(sys.argv[2]).resolve(strict=True)
if not site.is_dir() or not entry.is_file() or entry.name != "cli.py":
    raise ValueError("Invalid verified Python installation")
sys.path.insert(0, str(site))
sys.argv = [str(entry), *sys.argv[3:]]
runpy.run_path(str(entry), run_name="__main__")
