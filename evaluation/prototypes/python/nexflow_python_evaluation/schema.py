"""Draft 2020-12 validation with an explicit deny-retrieval local registry."""
import json
import re
import stat
from bisect import insort_right
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource
from referencing.exceptions import NoSuchResource, Unresolvable
from referencing.jsonschema import DRAFT202012
from .model import KINDS, Manifest, diagnostic, obj, pointer

def deny_retrieval(_uri):
    raise NoSuchResource(ref="unavailable-local-schema")

class SchemaEngine:
    def __init__(self, schemas: list[dict]):
        self.schemas = {}
        self.fields = set()
        def collect(value):
            if isinstance(value, dict):
                self.fields.update(obj(value.get("properties")))
                for child in value.values():
                    collect(child)
            elif isinstance(value, list):
                for child in value:
                    collect(child)
        for schema in schemas:
            if not isinstance(schema, dict) or not isinstance(schema.get("$id"), str) or schema["$id"] in self.schemas:
                raise ValueError("invalid local schema set")
            self.schemas[schema["$id"]] = schema
            collect(schema)
        self.registry = Registry(retrieve=deny_retrieval).with_resources(
            (uri, Resource(contents=schema, specification=DRAFT202012)) for uri, schema in self.schemas.items())
        self.validators = {obj(obj(schema.get("properties")).get("kind")).get("const"):
            Draft202012Validator(schema, registry=self.registry, format_checker=FormatChecker())
            for schema in schemas if obj(obj(schema.get("properties")).get("kind")).get("const") in KINDS}

    def _path(self, parts):
        path = pointer(part if isinstance(part, int) or part in self.fields else "<redacted>" for part in parts)
        return path if len(path) <= 512 else "<redacted-field>"

    def _issues(self, validator, value, public=False):
        issues = []
        def expanded(errors):
            for error in errors:
                yield error
                # The native context is structured; never copy native error prose.
                yield from expanded(error.context)
        def public_key(issue):
            path = issue.get("instancePath", "")
            if "missingProperty" in issue:
                path += pointer([issue["missingProperty"]])
            return (path, issue["category"])
        try:
            errors = validator.iter_errors(value)
            for error in expanded(errors) if public else errors:
                issue = {"code": "NF-SCHEMA", "category": error.validator, "instancePath": self._path(error.absolute_path)}
                if error.validator == "required":
                    # Match only trusted schema field names, never copy raw exception text.
                    missing = next((field for field in error.validator_value if f"{field!r} is a required property" == error.message), None)
                    issue["missingProperty"] = missing if missing in self.fields else "<redacted>"
                if public:
                    # Keep the globally earliest 201 projected diagnostics, not the
                    # first 201 native errors. One extra record preserves truncation.
                    insort_right(issues, issue, key=public_key)
                    if len(issues) > 201:
                        issues.pop()
                else:
                    issues.append(issue)
                if not public and len(issues) >= 201:
                    break
        except Unresolvable:
            return [{"code": "NF-SCHEMA", "category": "unresolved-local-schema"}]
        return sorted(issues, key=lambda issue: (issue.get("instancePath", ""), issue["category"], issue.get("missingProperty", "")))

    def validate_value(self, kind: str, value):
        if kind not in self.validators:
            raise ValueError("local kind schema unavailable")
        return self._issues(self.validators[kind], value)

    def validate(self, document: Manifest):
        return [diagnostic("NF-SCHEMA", document.file, document.kind,
                issue.get("instancePath", "") + pointer([issue["missingProperty"]]) if "missingProperty" in issue else issue.get("instancePath"), issue["category"])
                for issue in self._issues(self.validators[document.kind], document.value, public=True)]

    def validate_local(self, entry_id: str, value):
        if entry_id not in self.schemas:
            return [{"code": "NF-SCHEMA", "category": "unresolved-local-schema"}]
        return self._issues(Draft202012Validator(self.schemas[entry_id], registry=self.registry, format_checker=FormatChecker()), value)

    def validate_local_public(self, entry_id: str, value):
        if entry_id not in self.schemas:
            return [{"code": "NF-SCHEMA", "category": "unresolved-local-schema"}]
        return self._issues(Draft202012Validator(self.schemas[entry_id], registry=self.registry, format_checker=FormatChecker()), value, public=True)

def repository_schemas() -> SchemaEngine:
    directory = Path(__file__).resolve().parents[4] / "schemas"
    schemas = []
    for file in sorted(directory.glob("*.schema.json")):
        info = file.lstat()
        if not stat.S_ISREG(info.st_mode) or info.st_size > 1024 * 1024:
            raise ValueError("local schema unavailable")
        schemas.append(json.loads(file.read_bytes().decode("utf-8")))
    if not schemas:
        raise ValueError("local schema unavailable")
    return SchemaEngine(schemas)
