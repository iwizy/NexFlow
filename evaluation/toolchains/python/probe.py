"""Dependency capability probe, not a NexFlow candidate implementation."""

import json
import re
import sys

import yaml
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource
from referencing.exceptions import Unresolvable
from referencing.jsonschema import DRAFT202012


class CoreLoader(yaml.SafeLoader):
    """Use explicit core-style booleans and reject duplicate string keys."""


CoreLoader.yaml_implicit_resolvers = {
    key: [(tag, regexp) for tag, regexp in resolvers if tag not in (
        "tag:yaml.org,2002:bool", "tag:yaml.org,2002:timestamp"
    )]
    for key, resolvers in yaml.SafeLoader.yaml_implicit_resolvers.items()
}
CoreLoader.add_implicit_resolver("tag:yaml.org,2002:bool", re.compile(r"^(?:true|True|TRUE|false|False|FALSE)$"), list("tTfF"))


def unique_mapping(loader, node):
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=True)
        if not isinstance(key, str) or key in result:
            raise yaml.constructor.ConstructorError(None, None, "duplicate or non-string key", key_node.start_mark)
        result[key] = loader.construct_object(value_node, deep=True)
    return result


CoreLoader.add_constructor("tag:yaml.org,2002:map", unique_mapping)


def pointer(parts):
    return "".join("/" + str(part).replace("~", "~0").replace("/", "~1") for part in parts)


def probe(entry, registry):
    if entry["operation"] == "yaml":
        try:
            value = yaml.load(entry["text"], Loader=CoreLoader)
            return {"id": entry["id"], "valid": True, "value": value, "diagnostics": []}
        except yaml.YAMLError:
            return {"id": entry["id"], "valid": False, "diagnostics": [{"category": "yaml", "path": "", "keyword": "parse"}]}
    try:
        validator = Draft202012Validator(entry["schema"], registry=registry, format_checker=FormatChecker())
        errors = list(validator.iter_errors(entry["instance"]))
        return {"id": entry["id"], "valid": not errors, "diagnostics": [{"category": "schema", "path": pointer(error.absolute_path), "keyword": error.validator} for error in errors]}
    except Unresolvable:
        return {"id": entry["id"], "valid": False, "unresolvedReference": True, "diagnostics": [{"category": "reference", "path": "", "keyword": "$ref"}]}


def main():
    with open(sys.argv[1], encoding="utf-8") as stream:
        packet = json.load(stream)
    registry = Registry().with_resources((uri, Resource(contents=resource, specification=DRAFT202012)) for uri, resource in packet["resources"].items())
    print(json.dumps({"candidate": "python", "scope": packet["scope"], "results": [probe(entry, registry) for entry in packet["cases"]]}, separators=(",", ":")))


if __name__ == "__main__":
    main()
