"""Synthetic candidate checks, not an OS deny harness or target acceptance."""
import json
import os
import shutil
import stat
import subprocess
import sys
import tempfile
import unittest
from importlib.metadata import version
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parent))
from nexflow_python_evaluation import Manifest, Selection, SchemaEngine, discover, evaluate, evaluate_library_case, inspect, parse_yaml, repository_schemas
from nexflow_python_evaluation.files import InputFailure, LocalInputs
from nexflow_python_evaluation.inspection import InspectionLimit
from nexflow_python_evaluation.model import KINDS, json_line

ROOT = Path(__file__).resolve().parents[3]
FIXTURE = ROOT / "fixtures/cli/valid/minimal-project"
CLI = Path(__file__).parent / "cli.py"

def invoke(*arguments):
    return subprocess.run([sys.executable, "-I", "-B", str(CLI), *arguments], capture_output=True, text=True, timeout=5, check=False)

class CandidateTests(unittest.TestCase):
    def test_pinned_interpreter_and_all_dependency_versions(self):
        self.assertEqual(sys.version_info[:3], (3, 12, 14))
        lock = (ROOT / "evaluation/toolchains/python/requirements.lock").read_text()
        for line in lock.splitlines():
            if "==" in line and not line.startswith("#"):
                name, pinned = line.split()[0].split("==")
                self.assertEqual(version(name), pinned, name)

    def test_library_validation_inspection_and_explicit_selection(self):
        for command in ("validate", "inspect"):
            output = evaluate(command, Selection(str(FIXTURE), project="project.yaml"))
            self.assertEqual(output["exitCode"], 0)
            self.assertFalse(output["executionAuthorized"])
            self.assertEqual(output["checks"]["schema"], "passed")
            self.assertEqual(output["checks"]["semantic"], "not-run")
            self.assertEqual(output["result"]["documentCount"], 3)
        selected = evaluate("validate", Selection(str(FIXTURE), files=["project.yaml"]))
        self.assertEqual(selected["result"]["documentCount"], 1)
        self.assertEqual(selected["inputMode"], "explicit-file-list")

    def test_yaml_hazards_fail_closed(self):
        for text in ("a: 1\na: 2\n", "a: [\n", "a: 1\n---\na: 2\n", "a: &loop [*loop]\n",
            "a: .inf\n", "a: .nan\n", "? [a, b]\n: c\n", "a: !unknown secret\n",
            "a: !!python/object/apply:os.system ['PRIVATE_CANARY']\n", "!unknown key: value\n"):
            self.assertFalse(parse_yaml(text)["valid"], text)
        self.assertEqual(parse_yaml("a: 1\na: 2\n")["category"], "duplicate-key")

    def test_yaml_core_scalars_and_string_keys(self):
        result = parse_yaml("on: off\ndate: 2026-10-02\ntruth: true\nnumber: 012\nhex: 0x10\nfloat: 1e3\n1: first\n")
        self.assertTrue(result["valid"])
        self.assertEqual(result["value"], {"on": "off", "date": "2026-10-02", "truth": True, "number": 12, "hex": 16, "float": 1000.0, "1": "first"})
        self.assertFalse(parse_yaml("1: first\n'1': second\n")["valid"])

    def test_alias_depth_and_node_budgets(self):
        self.assertFalse(parse_yaml("value: " + "[" * 101 + "0" + "]" * 101)["valid"])
        self.assertFalse(parse_yaml("a: &item word\nb: [" + ",".join("*item" for _ in range(101)) + "]")["valid"])
        self.assertFalse(parse_yaml("a: [" + ",".join("0" for _ in range(200001)) + "]")["valid"])
        self.assertEqual(parse_yaml("a: &item word\nb: [*item, *item]")["value"]["b"], ["word", "word"])

    def test_source_types_and_read_limits(self):
        with tempfile.TemporaryDirectory(prefix="nexflow-python-test-") as directory:
            root = Path(directory)
            (root / "plain.yaml").write_text("a: 1\n")
            (root / "folder.yaml").mkdir()
            (root / "large.yaml").write_bytes(b"a" * (1024 * 1024 + 1))
            (root / "invalid.yaml").write_bytes(b"\xff")
            inputs = LocalInputs(directory)
            for file in ("../outside.yaml", "/outside.yaml", "C:/outside.yaml", "folder/../plain.yaml", "a\\b.yaml", "a\0b.yaml", "folder.yaml", "large.yaml", "invalid.yaml", "missing.yaml", "plain.json"):
                with self.assertRaises(InputFailure, msg=file):
                    inputs.read(file)
            self.assertEqual(inputs.read("plain.yaml"), "a: 1\n")

    @unittest.skipIf(sys.platform == "win32", "symlink privileges are a later platform experiment")
    def test_symlinks_and_parent_links_are_not_followed(self):
        with tempfile.TemporaryDirectory(prefix="nexflow-python-test-") as directory:
            root = Path(directory)
            (root / "plain.yaml").write_text("a: 1\n")
            (root / "linked.yaml").symlink_to(root / "plain.yaml")
            (root / "parent").symlink_to(root, target_is_directory=True)
            for file in ("linked.yaml", "parent/plain.yaml"):
                with self.assertRaises(InputFailure):
                    LocalInputs(directory).read(file)

    @unittest.skipUnless(hasattr(os, "mkfifo"), "no FIFO API on this platform")
    def test_fifo_rejection_does_not_wait_for_writer(self):
        with tempfile.TemporaryDirectory(prefix="nexflow-python-test-") as directory:
            os.mkfifo(Path(directory) / "pipe.yaml")
            result = invoke("validate", "--root", directory, "--file", "pipe.yaml", "--format", "json")
            self.assertEqual(result.returncode, 1)
            self.assertIn("NF-DISCOVERY-UNSAFE-SOURCE", result.stdout)

    def test_invalid_root_and_unsafe_sources_are_redacted(self):
        for root in ("", "/PRIVATE_CANARY", None):
            output = json_line(evaluate("validate", Selection(root)))
            self.assertNotIn("PRIVATE_CANARY", output)
            self.assertFalse(json.loads(output)["success"])
        output = json_line(evaluate("validate", Selection(str(FIXTURE), files=["/PRIVATE_CANARY.yaml"])))
        self.assertNotIn("PRIVATE_CANARY", output)

    def test_commands_options_duplicates_and_mixed_selection_are_rejected(self):
        direct = evaluate("run", Selection("/PRIVATE_CANARY"))
        self.assertEqual(direct["exitCode"], 2)
        self.assertEqual(direct["checks"]["discovery"], "not-run")
        for arguments in (("run",), ("init",), ("graph",), ("validate", "--provider", "PRIVATE_CANARY"),
            ("validate", "--root", "/PRIVATE_CANARY", "--root", "/second"),
            ("validate", "--root", "/PRIVATE_CANARY", "--project", "p.yaml", "--file", "a.yaml"),
            ("validate", "--root", "/PRIVATE_CANARY", "--format", "xml"),
            ("validate", "--roo", "/PRIVATE_CANARY")):
            result = invoke(*arguments, "--format", "json")
            self.assertEqual(result.returncode, 2)
            self.assertEqual(result.stderr, "")
            self.assertEqual(json.loads(result.stdout)["checks"]["discovery"], "not-run")
            self.assertNotIn("PRIVATE_CANARY", result.stdout)

    def test_json_text_and_file_order_are_stable(self):
        arguments = ("validate", "--root", str(FIXTURE), "--file", "missing.yaml")
        text, machine = invoke(*arguments), invoke(*arguments, "--format", "json")
        self.assertEqual(text.returncode, machine.returncode)
        self.assertEqual(text.stderr, "")
        for issue in json.loads(machine.stdout)["diagnostics"]:
            self.assertIn(issue["code"], text.stdout)
        files = ["project.yaml", "actors.yaml", "agents.yaml"]
        self.assertEqual(evaluate("inspect", Selection(str(FIXTURE), files=files)), evaluate("inspect", Selection(str(FIXTURE), files=list(reversed(files)))))

    def test_input_files_unchanged(self):
        before = {file.name: (file.read_bytes(), stat.S_IMODE(file.stat().st_mode)) for file in FIXTURE.iterdir() if file.is_file()}
        evaluate("inspect", Selection(str(FIXTURE)))
        after = {file.name: (file.read_bytes(), stat.S_IMODE(file.stat().st_mode)) for file in FIXTURE.iterdir() if file.is_file()}
        self.assertEqual(before, after)

    def test_schema_messages_do_not_echo_values_or_extra_keys(self):
        with tempfile.TemporaryDirectory(prefix="nexflow-python-test-") as directory:
            shutil.copytree(FIXTURE, directory, dirs_exist_ok=True)
            file = Path(directory) / "project.yaml"
            value = parse_yaml(file.read_text())["value"]
            value["project"]["description"] = {"PRIVATE_CANARY": "secret-value"}
            value["PRIVATE_CANARY"] = "secret-value"
            file.write_text(json.dumps(value))
            output = evaluate("validate", Selection(directory))
            self.assertEqual(output["checks"]["schema"], "failed")
            self.assertNotIn("PRIVATE_CANARY", json_line(output))
            self.assertNotIn("secret-value", json_line(output))

    def test_source_count_and_duplicate_limits(self):
        for files in (["project.yaml", "project.yaml"], [f"p{index}.yaml" for index in range(129)]):
            self.assertFalse(evaluate("validate", Selection(str(FIXTURE), files=files))["success"])

    def test_inspection_limits_and_allowlist(self):
        with self.assertRaises(InspectionLimit):
            inspect([Manifest("actors.yaml", "ActorSet", {"actors": [{"id": f"actor-{index}"} for index in range(1001)]})])
        assembly = discover(Selection(str(FIXTURE)))
        assembly["documents"][0].value["unlistedRef"] = "PRIVATE_CANARY"
        self.assertNotIn("PRIVATE_CANARY", json_line(inspect(assembly["documents"])))
        catalog = json.loads((ROOT / "evaluation/library-cases.json").read_text())
        documents = []
        for entry in catalog["cases"]:
            if entry["operation"] == "manifest-schema" and entry["expected"]["valid"]:
                value = parse_yaml(LocalInputs(str(ROOT)).read(entry["input"]["file"]))["value"]
                documents.append(Manifest(entry["input"]["file"], value["kind"], value))
        self.assertEqual({row["kind"] for row in inspect(documents)["summary"]}, set(KINDS))

    def test_remote_schema_reference_fails_without_retrieval(self):
        from nexflow_python_evaluation.schema import deny_retrieval
        from referencing.exceptions import NoSuchResource
        with self.assertRaises(NoSuchResource):
            deny_retrieval("https://PRIVATE_CANARY.invalid/schema")
        schema = {"$id": "https://nexflow.dev/local/test", "$ref": "https://unavailable.invalid/schema"}
        issues = SchemaEngine([schema]).validate_local(schema["$id"], "value")
        self.assertEqual(issues, [{"code": "NF-SCHEMA", "category": "unresolved-local-schema"}])

    def test_no_candidate_network_or_process_calls_in_validation(self):
        with patch("socket.socket", side_effect=AssertionError("network forbidden")), patch("subprocess.Popen", side_effect=AssertionError("process forbidden")), patch("os.system", side_effect=AssertionError("process forbidden")):
            self.assertTrue(evaluate("validate", Selection(str(FIXTURE)))["success"])

    def test_semantic_and_namespace_absence_is_explicit(self):
        schemas = repository_schemas()
        for operation in ("semantic-fragment", "workflow-namespace", "artifact-namespace"):
            result = evaluate_library_case({"id": "pending", "operation": operation, "input": {}}, str(ROOT), schemas)
            self.assertIsNone(result["valid"])
            self.assertEqual(result["status"], "not-implemented")
            self.assertEqual(result["checks"], {"runtime": "not-run", "extensions": "not-run"})

if __name__ == "__main__":
    unittest.main()
