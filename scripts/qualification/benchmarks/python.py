"""Measurement-only native API caller; never receives an oracle or another backend."""
import json, sys, time
module_root, root, packet_file, encoded_passes, locked_site, adapter_root = sys.argv[1:]
sys.path.insert(0, adapter_root)
from windows_paths import enable_container_paths
enable_container_paths()
sys.path.insert(0, locked_site)
sys.path.insert(0, module_root)
from nexflow_python_evaluation import evaluate_library_case, repository_schemas
passes = int(encoded_passes)
assert passes in (1, 10, 100)
packet = json.loads(open(packet_file, encoding="utf-8").read())
assert 0 < len(packet) <= 4096 and all("expected" not in entry for entry in packet)
before = json.dumps(packet, sort_keys=True)
schemas = repository_schemas()
def batch():
    start, checksum, count, last = time.perf_counter_ns(), 0, 0, []
    for _ in range(passes):
        last = []
        for index, entry in enumerate(packet):
            result = evaluate_library_case(entry, root, schemas)
            checksum += (index + 1) * ((3 if result["valid"] is True else 5 if result["valid"] is False else 7) + len(result["diagnostics"]) * 11)
            count += 1
            last.append(result)
        if time.perf_counter_ns() - start > 120_000_000_000:
            raise RuntimeError("batch deadline")
    return {"ms": (time.perf_counter_ns() - start) / 1_000_000, "checksum": checksum, "count": count, "last": last}
warmup, sample = batch(), batch()
assert warmup["checksum"] == sample["checksum"] and warmup["last"] == sample["last"]
assert sample["count"] == len(packet) * passes and json.dumps(packet, sort_keys=True) == before
print(json.dumps({"passes": passes, "cases": len(packet), "completed": sample["count"], "warmups": 1, "warmupMs": warmup["ms"], "validationMs": sample["ms"], "checksum": sample["checksum"], "results": sample["last"], "clock": "time.perf_counter_ns, monotonic external to evaluated API; startup/schema construction excluded", "inputUnchanged": True}, separators=(",", ":")))
