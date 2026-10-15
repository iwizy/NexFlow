"""Focused regressions for the local-only provisioning boundary."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("provision", Path(__file__).with_name("evaluation-python-provision.py"))
provision = importlib.util.module_from_spec(spec)
spec.loader.exec_module(provision)


class LockedInputTests(unittest.TestCase):
    def parse(self, text):
        with tempfile.TemporaryDirectory(prefix="nf-wheel-lock-") as temporary:
            path = Path(temporary) / "requirements.lock"
            path.write_text(text)
            return provision.locked_requirements(path)

    def test_exact_current_lock_is_accepted(self):
        rows = provision.locked_requirements(Path("evaluation/prototypes/python/requirements.lock"))
        self.assertEqual(len(rows), 9)
        self.assertNotIn("pip", [r["name"] for r in rows])
        self.assertTrue(all(r["hashes"] for r in rows))

    def test_remote_and_ambient_inputs_are_rejected(self):
        for text in ("--find-links https://example.invalid/wheels", "a @ https://example.invalid/a.whl",
                     "-r another.lock", "--extra-index-url https://example.invalid", "a>=1", "a[extra]==1",
                     "./local.whl", "a==1", "a==1\na==1"):
            with self.subTest(text=text), self.assertRaises(ValueError):
                self.parse(text)


if __name__ == "__main__":
    unittest.main()
