"""Bounded unique-string-key YAML-to-JSON conversion, without executable tags."""
import math
import re
from typing import Any
import yaml

class DuplicateKey(ValueError):
    pass

class CoreLoader(yaml.SafeLoader):
    def __init__(self, stream):
        super().__init__(stream)
        self.aliases = 0
        self.depth = 0

    def compose_node(self, parent, index):
        if self.check_event(yaml.AliasEvent):
            self.aliases += 1
            if self.aliases > 100:
                raise ValueError("alias budget")
        self.depth += 1
        try:
            if self.depth > 100:
                raise ValueError("depth budget")
            return super().compose_node(parent, index)
        finally:
            self.depth -= 1

CoreLoader.yaml_implicit_resolvers = {
    key: [(tag, expression) for tag, expression in entries if tag not in (
        "tag:yaml.org,2002:bool", "tag:yaml.org,2002:timestamp", "tag:yaml.org,2002:int", "tag:yaml.org,2002:float")]
    for key, entries in yaml.SafeLoader.yaml_implicit_resolvers.items()
}
CoreLoader.add_implicit_resolver("tag:yaml.org,2002:bool", re.compile(r"^(?:true|True|TRUE|false|False|FALSE)$"), list("tTfF"))
CoreLoader.add_implicit_resolver("tag:yaml.org,2002:int", re.compile(r"^[+-]?(?:[0-9][0-9_]*|0o[0-7_]+|0x[0-9a-fA-F_]+)$"), list("-+0123456789"))
CoreLoader.add_implicit_resolver("tag:yaml.org,2002:float", re.compile(r"^[+-]?(?:(?:[0-9][0-9_]*\.[0-9_]*|\.[0-9][0-9_]*)(?:[eE][+-]?[0-9]+)?|[0-9][0-9_]*[eE][+-]?[0-9]+|\.(?:inf|Inf|INF|nan|NaN|NAN))$"), list("-+0123456789."))

def integer(loader, node):
    value = loader.construct_scalar(node).replace("_", "")
    sign = -1 if value.startswith("-") else 1
    value = value.lstrip("+-")
    return sign * int(value, 16 if value.startswith("0x") else 8 if value.startswith("0o") else 10)

def unique_mapping(loader, node):
    result = {}
    for key_node, value_node in node.value:
        if not isinstance(key_node, yaml.ScalarNode) or key_node.tag not in {
            "tag:yaml.org,2002:" + tag for tag in ("str", "bool", "int", "float", "null")
        }:
            raise ValueError("unsupported mapping key")
        key = key_node.value
        if key in result:
            raise DuplicateKey()
        result[key] = loader.construct_object(value_node, deep=True)
    return result

CoreLoader.add_constructor("tag:yaml.org,2002:int", integer)
CoreLoader.add_constructor("tag:yaml.org,2002:map", unique_mapping)

def parse_yaml(text: str) -> dict:
    try:
        if not isinstance(text, str) or len(text.encode("utf-8")) > 1024 * 1024:
            raise ValueError("byte budget")
        value = yaml.load(text, Loader=CoreLoader)  # SafeLoader subclass only; one document.
        active, nodes = set(), 0
        def compatible(item: Any, depth: int = 0):
            nonlocal nodes
            nodes += 1
            if depth > 100 or nodes > 200000:
                return False
            if item is None or isinstance(item, (str, bool, int)):
                return True
            if isinstance(item, float):
                return math.isfinite(item)
            if not isinstance(item, (dict, list)) or id(item) in active:
                return False
            active.add(id(item))
            valid = all(compatible(child, depth + 1) for child in (item.values() if isinstance(item, dict) else item))
            active.remove(id(item))
            return valid
        if not compatible(value):
            raise ValueError("non-JSON input")
        return {"valid": True, "value": value, "category": None}
    except DuplicateKey:
        return {"valid": False, "value": None, "category": "duplicate-key"}
    except (yaml.YAMLError, ValueError, TypeError, RecursionError, OverflowError):
        return {"valid": False, "value": None, "category": "syntax"}
