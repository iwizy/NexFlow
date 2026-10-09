"""Trusted experiment driver. Inputs contain no oracle; no JavaScript backend."""
import copy
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from nexflow_python_evaluation import evaluate_library_case, repository_schemas
from nexflow_python_evaluation.model import json_line

def main():
    if len(sys.argv) != 2:
        raise ValueError("invalid driver arguments")
    encoded = sys.stdin.buffer.read(4 * 1024 * 1024 + 1)
    if len(encoded) > 4 * 1024 * 1024:
        raise ValueError("library packet exceeds budget")
    packet = json.loads(encoded)
    if not isinstance(packet, list) or not 1 <= len(packet) <= 4096:
        raise ValueError("invalid library packet")
    schemas, results = repository_schemas(), []
    for entry in packet:
        before = copy.deepcopy(entry)
        first = evaluate_library_case(entry, sys.argv[1], schemas)
        second = evaluate_library_case(entry, sys.argv[1], schemas)
        if first != second or before != entry:
            raise ValueError("unstable or mutated library input")
        results.append(first)
    sys.stdout.write(json_line(results))

if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.stderr.write("Library experiment failed without a result.\n")
        sys.exit(1)
