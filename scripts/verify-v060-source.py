"""Verify both public source archives before making their files available to the fixture."""
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import sys
import tarfile
from urllib.request import Request, urlopen
import zipfile

revision, output = sys.argv[1:]
root = Path(output)
root.mkdir()
repo = "iwizy/NexFlow"
tag = "v0.6.0"

def digest(contents):
    return hashlib.sha256(contents).hexdigest()

def fetch(url):
    return urlopen(Request(url, headers={"User-Agent": "NexFlow source release verification"}), timeout=90)

def public_api(path):
    with fetch(f"https://api.github.com/repos/{repo}/{path}") as response:
        return json.load(response)

release = public_api(f"releases/tags/{tag}")
reference = public_api(f"git/ref/tags/{tag}")
assert release["tag_name"] == tag and release["published_at"] and not release["draft"]
assert not release["prerelease"] and not release["assets"]
assert reference["object"]["type"] == "commit" and reference["object"]["sha"] == revision
assert release["target_commitish"] == revision

# Read blobs directly so Windows line-ending conversions cannot affect the comparison.
entries = subprocess.check_output(["git", "ls-tree", "-rz", revision]).split(b"\0")
expected_paths = {}
for entry in filter(None, entries):
    metadata, name = entry.split(b"\t", 1)
    mode, kind, oid = metadata.split()
    assert mode in (b"100644", b"100755") and kind == b"blob"
    expected_paths[name.decode("utf-8")] = oid
blob_data = subprocess.run(
    ["git", "cat-file", "--batch"], input=b"\n".join(expected_paths.values()) + b"\n",
    stdout=subprocess.PIPE, check=True,
).stdout
expected = {}
with io.BytesIO(blob_data) as stream:
    for name, oid in expected_paths.items():
        actual_oid, kind, size = stream.readline().split()
        assert actual_oid == oid and kind == b"blob"
        expected[name] = stream.read(int(size))
        assert stream.read(1) == b"\n", name
    assert stream.read() == b""

def members(archive):
    if isinstance(archive, zipfile.ZipFile):
        for item in archive.infolist():
            if not item.is_dir():
                mode = (item.external_attr >> 16) & 0o170000
                assert mode in (0, 0o100000), item.filename
                yield item.filename, archive.read(item)
    else:
        for item in archive:
            if not item.isdir() and item.isfile():
                with archive.extractfile(item) as stream:
                    yield item.name, stream.read()
            else:
                assert item.isdir(), item.name

def files(archive):
    prefix = None
    result = {}
    for raw, contents in members(archive):
        name = PurePosixPath(raw)
        assert not name.is_absolute() and "\\" not in raw
        lead, *parts = raw.split("/")
        assert lead and len(parts) and all(part not in ("", ".", "..") and ":" not in part for part in parts)
        if prefix is None:
            prefix = lead
        assert lead == prefix
        relative = "/".join(parts)
        assert relative not in result, relative
        result[relative] = contents
    assert len(result) > 1000
    return result

assert len({key.casefold() for key in expected}) == len(expected), "case-insensitive archive collision"
inventory = digest(json.dumps([[name, digest(expected[name])] for name in sorted(expected)], separators=(",", ":")).encode())
reports = {}
for extension in ("zip", "tar.gz"):
    url = f"https://github.com/{repo}/archive/refs/tags/{tag}.{extension}"
    download = root / f"public.{extension}"
    with fetch(url) as response, download.open("wb") as stream:
        shutil.copyfileobj(response, stream)
    opener = zipfile.ZipFile if extension == "zip" else tarfile.open
    with opener(download) as archive:
        payload = files(archive)
    assert payload.keys() == expected.keys(), extension
    for name, data in payload.items():
        assert data == expected[name], (extension, name)
    extraction = root / ("zip" if extension == "zip" else "tar")
    extraction.mkdir()
    for name, contents in payload.items():
        destination = extraction.joinpath(*name.split("/"))
        destination.parent.mkdir(parents=True, exist_ok=True)
        with destination.open("xb") as stream:
            stream.write(contents)
    reports[extension] = {"url": url, "sha256": digest(download.read_bytes()), "bytes": download.stat().st_size}

print(json.dumps({
    "tag": tag, "revision": revision, "releaseId": release["id"], "publishedAt": release["published_at"],
    "fileCount": len(expected), "inventorySha256": inventory, "archives": reports,
}, indent=2))
