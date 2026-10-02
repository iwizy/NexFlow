"""Declarative candidate types and output helpers; no execution authority."""
import json
import re
from dataclasses import dataclass
from typing import Any

KINDS = {
    "Project": ("project", "project", "id"), "ActorSet": ("actors", "actor", "id"),
    "AgentSet": ("agents", "agent", "id"), "AgentDefinitionSet": ("agentDefinitions", "agent-definition", "id"),
    "CapabilitySet": ("capabilities", "capability", "id"), "PermissionSet": ("permissions", "permission", "id"),
    "TaskSet": ("tasks", "task", "id"), "Workflow": ("workflow", "workflow", "id"),
    "HandoffSet": ("handoffs", "handoff", "id"), "ContextSet": ("contextSources", "context-source", "id"),
    "MemorySet": ("memoryScopes", "memory-scope", "scope"), "ProviderSet": ("providers", "provider", "id"),
    "ModelProfileSet": ("modelProfiles", "model-profile", "id"), "PromptSet": ("promptSets", "prompt-set", "id"),
    "RetrievalProfileSet": ("retrievalProfiles", "retrieval-profile", "id"), "EventSet": ("events", "event", "type"),
    "ExtensionSet": ("extensions", "extension", "id"),
}

@dataclass(frozen=True)
class Selection:
    root: str
    project: str | None = None
    files: list[str] | None = None

@dataclass(frozen=True)
class Manifest:
    file: str
    kind: str
    value: dict[str, Any]

def obj(value: Any) -> dict:
    return value if isinstance(value, dict) else {}

def array(value: Any) -> list:
    return value if isinstance(value, list) else []

def pointer(parts) -> str:
    return "".join("/" + str(part).replace("~", "~0").replace("/", "~1") for part in parts)

def safe_locator(value: Any) -> str:
    if (not isinstance(value, str) or not value or len(value) > 512
        or re.search(r"[:\\\x00-\x1f]", value) or value.startswith("/")
        or any(part in ("", ".", "..") for part in value.split("/"))):
        return "<redacted-source>"
    return value

def display_id(value: Any) -> str:
    return value if isinstance(value, str) and len(value) <= 128 and re.fullmatch(r"[a-z][a-z0-9]*(?:[-_.][a-z0-9]+)*", value) else "<redacted-id>"

def diagnostic(code: str, file: str | None = "<input>", kind: str | None = None,
               path: str | None = None, keyword: str | None = None) -> dict:
    messages = {
        "NF-SCHEMA": "Local schema constraint is not satisfied.",
        "NEXFLOW-PROTOTYPE-USAGE": "Only validate or inspect with an explicit root and supported options are accepted.",
        "NEXFLOW-PROTOTYPE-INTERNAL": "The reviewed local validation setup could not produce a result.",
        "NEXFLOW-PROTOTYPE-INSPECTION-LIMIT": "Declared inspection exceeds its fixed budget.",
    }
    return {"severity": "error", "code": code, "message": messages.get(code, "Selected manifest input does not satisfy discovery policy."),
            "file": file if file in (None, "<input>") else safe_locator(file), "kind": kind,
            "path": path, "keyword": keyword, "related": []}

def ordered(items: list[dict]) -> list[dict]:
    return sorted(items, key=lambda item: tuple(item.get(field) or "" for field in
                  ("file", "path", "severity", "code", "kind", "keyword", "message")))

def envelope(command: str | None) -> dict:
    return {"formatVersion": "0.4-draft", "tool": {"name": "nexflow-python-evaluation", "version": "unreleased"},
            "supportedSpecVersions": ["0.1"], "command": command, "success": False, "exitCode": 1, "inputMode": None,
            "checks": {"discovery": "not-run", "schema": "not-run", "semantic": "not-run", "coreProfile": "not-run", "extensionProfiles": "not-run"},
            "executionAuthorized": False, "diagnostics": [], "truncated": False, "result": None}

def json_line(value: Any) -> str:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, separators=(",", ":")) + "\n"
