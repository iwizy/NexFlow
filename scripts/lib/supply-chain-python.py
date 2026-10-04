"""Read installed metadata only; never import candidate-selected modules."""
import importlib.metadata as md
import json
import sys
import pathlib
import hashlib
from packaging.requirements import Requirement
from packaging.markers import default_environment


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def info(dist, owner=None):
    metadata = dist.metadata
    license_text = metadata.get("License-Expression") or metadata.get("License") or "NOASSERTION"
    if len(license_text) > 160 or "\n" in license_text:
        license_text = "NOASSERTION"
    files = list(dist.files or [])
    receipts = [{"file": str(f), "sha256": digest(dist.locate_file(f))} for f in files
                if ("license" in str(f).lower() or "copying" in str(f).lower()) and dist.locate_file(f).is_file()]
    native = [{"file": str(f), "sha256": digest(dist.locate_file(f))} for f in files
              if str(f).endswith((".so", ".dylib", ".pyd")) and dist.locate_file(f).is_file()]
    dependencies = []
    for raw in dist.requires or []:
        requirement = Requirement(raw)
        dependencies.append({"name": requirement.name, "specifier": str(requirement.specifier),
                             "marker": str(requirement.marker) if requirement.marker else None,
                             "active": not requirement.marker or requirement.marker.evaluate({**default_environment(), "extra": ""})})
    return {"name": metadata["Name"], "version": dist.version, "license": license_text,
            "classifiers": [c for c in metadata.get_all("Classifier", []) if c.startswith("License ::")],
            "requires": dependencies, "licenseFiles": receipts, "nativeFiles": native,
            "metadataSha256": hashlib.sha256(dist.read_text("METADATA").encode()).hexdigest(), "owner": owner}


installed = list(md.distributions())
base = pathlib.Path(md.distribution("pip").locate_file(""))
vendored = [info(d, "setuptools") for d in md.distributions(path=[str(base / "setuptools" / "_vendor")])]
vendor_lists = []
for owner, folder in (("pip", "_vendor"), ("wheel", "vendored"), ("setuptools/_vendor/wheel", "vendored")):
    manifest = base / owner / folder / "vendor.txt"
    if not manifest.exists():
        continue
    rows = []
    for line in manifest.read_text().splitlines():
        line = line.split("#", 1)[0].strip()
        if not line:
            continue
        requirement = Requirement(line)
        version = next((specifier.version for specifier in requirement.specifier if specifier.operator == "=="), None)
        rows.append({"name": requirement.name, "version": version})
    license_files = [{"file": str(p.relative_to(base)), "sha256": digest(p)}
                     for p in (base / owner / folder).rglob("*")
                     if p.is_file() and p.name.lower().startswith(("license", "copying"))]
    vendor_lists.append({"owner": owner, "sha256": digest(manifest), "packages": rows, "licenseFiles": license_files})
rpds = md.distribution("rpds-py")
embedded_path = next(rpds.locate_file(f) for f in rpds.files if str(f).endswith("sboms/rpds-py.cyclonedx.json"))
print(json.dumps({"python": sys.version.split()[0], "packages": [info(d) for d in installed],
                  "vendored": vendored, "vendorLists": vendor_lists,
                  "embedded": json.loads(embedded_path.read_text()), "embeddedSha256": digest(embedded_path)}))
