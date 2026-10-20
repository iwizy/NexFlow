"""Trusted hash-locked wheel provisioning; pip is never a network client here."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.request
import zipfile

PIP_URL = "https://files.pythonhosted.org/packages/f3/6e/1736e5b4ae2b778ef2f81c47d797de9f891d4d8acb047a24ca37a60294dd/pip-26.2.1-py3-none-any.whl"
PIP_HASH = "71138adf1f4ca900cdb7d289c21b7494329f2332b6d85f0e1c42108c0384ed3e"


def locked_requirements(path):
    rows = []
    for line in path.read_text().splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if line.endswith(" " + chr(92)):
            line = line[:-2]
        match = re.fullmatch(r"([A-Za-z0-9_.-]+)==([0-9][A-Za-z0-9_.]*)", line)
        if match:
            rows.append({"name": match[1], "version": match[2], "hashes": []})
            continue
        digest = re.fullmatch(r"\s+--hash=sha256:([a-f0-9]{64})", line)
        if not digest or not rows:
            raise ValueError("only exact name==version and sha256 hashes are permitted")
        rows[-1]["hashes"].append(digest[1])
    names = [r["name"].lower().replace("_", "-") for r in rows]
    if not rows or len(names) != len(set(names)) or any(not r["hashes"] for r in rows):
        raise ValueError("incomplete or duplicate hash lock")
    return rows


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise ValueError("unexpected redirect")


def fetch(url):
    if not url.startswith(("https://pypi.org/pypi/", "https://files.pythonhosted.org/packages/")):
        raise ValueError("unexpected package origin")
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    with opener.open(url, timeout=60) as response:
        return response.read()


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def provision(lock, wheelhouse, provisioner, venv, offline=False):
    rows = locked_requirements(lock)
    for directory in (wheelhouse, provisioner):
        directory.mkdir(parents=True, exist_ok=True)
        if directory.is_symlink():
            raise ValueError("trusted directories must not be symlinks")
    pip_wheel = provisioner / "pip-26.2.1-py3-none-any.whl"
    if not offline:
        pip_wheel.write_bytes(fetch(PIP_URL))
    if pip_wheel.is_symlink() or digest(pip_wheel) != PIP_HASH:
        raise ValueError("pip archive hash mismatch")
    pip_root = provisioner / "unpacked"
    if not pip_root.exists():
        with zipfile.ZipFile(pip_wheel) as archive:
            if any(Path(n).is_absolute() or ".." in Path(n).parts for n in archive.namelist()):
                raise ValueError("unsafe wheel member")
            archive.extractall(pip_root)
    # Always compare the code used for installation with the verified wheel.
    with zipfile.ZipFile(pip_wheel) as archive:
        for name in archive.namelist():
            if not name.endswith("/"):
                actual = pip_root / name
                if actual.is_symlink() or actual.read_bytes() != archive.read(name):
                    raise ValueError("provisioner payload changed")
    sys.path.insert(0, str(pip_root))
    from pip._vendor.packaging.tags import sys_tags
    from pip._vendor.packaging.utils import parse_wheel_filename
    from pip._vendor.packaging.requirements import Requirement
    supported = list(sys_tags())
    receipts = []
    if not offline:
        for row in rows:
            metadata_url = "https://pypi.org/pypi/{name}/{version}/json".format(**row)
            raw = fetch(metadata_url)
            metadata = json.loads(raw)
            choices = []
            for item in metadata["urls"]:
                if not item["filename"].endswith(".whl") or item["digests"]["sha256"] not in row["hashes"]:
                    continue
                _, _, _, tags = parse_wheel_filename(item["filename"])
                ranks = [supported.index(t) for t in tags if t in supported]
                if ranks:
                    choices.append((min(ranks), item["filename"], item))
            if not choices:
                raise ValueError("no compatible locked wheel: " + row["name"])
            item = min(choices)[2]
            data = fetch(item["url"])
            if hashlib.sha256(data).hexdigest() != item["digests"]["sha256"]:
                raise ValueError("wheel hash mismatch")
            (wheelhouse / item["filename"]).write_bytes(data)
            receipts.append({"name": row["name"], "version": row["version"], "file": item["filename"],
                             "url": item["url"], "sha256": item["digests"]["sha256"],
                             "metadataUrl": metadata_url, "metadataSha256": hashlib.sha256(raw).hexdigest()})
        (wheelhouse / "receipts.json").write_text(json.dumps(receipts, indent=2) + "\n")
    else:
        receipts = json.loads((wheelhouse / "receipts.json").read_text())
    wheels = list(wheelhouse.glob("*.whl"))
    expected = {r["file"]: r for r in receipts}
    if len(wheels) != len(rows) or set(expected) != {p.name for p in wheels}:
        raise ValueError("wheelhouse must contain exactly the selected runtime wheels")
    for wheel in wheels:
        if wheel.is_symlink() or digest(wheel) != expected[wheel.name]["sha256"]:
            raise ValueError("wheelhouse payload changed")
        row = next((r for r in rows if r["name"] == expected[wheel.name]["name"] and r["version"] == expected[wheel.name]["version"]), None)
        if row is None or digest(wheel) not in row["hashes"]:
            raise ValueError("wheel not bound to current lock")
    if venv.exists():
        raise ValueError("use a new scoped virtualenv")
    system = {key: os.environ[key] for key in ("SystemRoot", "WINDIR", "TEMP", "TMP") if key in os.environ} if os.name == "nt" else {}
    env = {**system, "PATH": os.pathsep.join([str(Path(sys.executable).parent), str(Path(os.environ["SystemRoot"]) / "System32")]) if os.name == "nt" else "/usr/bin:/bin", "LANG": "C", "LC_ALL": "C", "PIP_CONFIG_FILE": os.devnull, "PYTHONUTF8": "1"}
    subprocess.run([sys.executable, "-I", "-X", "utf8", "-m", "venv", "--without-pip", str(venv)], check=True, env=env)
    interpreter = venv / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    bootstrap = "import sys;sys.path.insert(0,sys.argv.pop(1));from pip._internal.cli.main import main;raise SystemExit(main())"
    subprocess.run([sys.executable, "-I", "-X", "utf8", "-c", bootstrap, str(pip_root), "--isolated", "--python", str(interpreter),
                    "install", "--no-index", "--find-links", str(wheelhouse.resolve()), "--require-hashes", "--only-binary=:all:",
                    "--no-cache-dir", "--no-compile", "--disable-pip-version-check", "-r", str(lock.resolve())], check=True, env=env)
    # pip check via separate provisioner, never install it into the candidate.
    subprocess.run([sys.executable, "-I", "-X", "utf8", "-c", bootstrap, str(pip_root), "--isolated", "--python", str(interpreter),
                    "check", "--disable-pip-version-check"], check=True, env=env)
    return receipts


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--lock", type=Path, default=Path("evaluation/prototypes/python/requirements.lock"))
    parser.add_argument("--wheelhouse", required=True, type=Path)
    parser.add_argument("--provisioner", required=True, type=Path)
    parser.add_argument("--venv", required=True, type=Path)
    parser.add_argument("--offline", action="store_true")
    args = parser.parse_args()
    provision(args.lock.resolve(), args.wheelhouse.resolve(), args.provisioner.resolve(), args.venv.resolve(), args.offline)
