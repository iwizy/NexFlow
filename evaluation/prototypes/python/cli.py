"""Only the two reviewed local commands; argument failures precede input reads."""
import argparse
import sys
from pathlib import Path

# Under -I, add only this trusted source directory, never the selected root.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from nexflow_python_evaluation import Selection, evaluate
from nexflow_python_evaluation.model import diagnostic, envelope, json_line

class UsageError(ValueError):
    pass

class Parser(argparse.ArgumentParser):
    def error(self, _message):
        raise UsageError()
    def exit(self, _status=0, _message=None):
        raise UsageError()

def json_requested(arguments):
    index = 0
    while index < len(arguments):
        token = arguments[index]
        if token == "--":
            break
        if token == "--format=json" or token == "--format" and arguments[index + 1:index + 2] == ["json"]:
            return True
        index += 2 if token in ("--root", "--project", "--file", "--format") else 1
    return False

def main(arguments):
    use_json = json_requested(arguments)
    try:
        if not arguments or arguments[0] not in ("validate", "inspect"):
            raise UsageError()
        parser = Parser(add_help=False, allow_abbrev=False)
        for option in ("root", "project", "format"):
            parser.add_argument("--" + option)
        parser.add_argument("--file", action="append")
        # argparse otherwise accepts repeated singleton options with last-wins.
        seen, index = set(), 1
        while index < len(arguments):
            token = arguments[index]
            name = token.split("=", 1)[0]
            if name not in ("--root", "--project", "--file", "--format") or name != "--file" and name in seen:
                raise UsageError()
            seen.add(name)
            index += 1 if "=" in token else 2
        values = parser.parse_args(arguments[1:])
        if not values.root or values.project is not None and (not values.project or values.file is not None) or values.file is not None and any(not value for value in values.file) or values.format not in (None, "json", "text"):
            raise UsageError()
        output = evaluate(arguments[0], Selection(values.root, values.project, values.file))
        use_json = values.format == "json"
    except UsageError:
        output = envelope(None)
        output.update(exitCode=2, diagnostics=[diagnostic("NEXFLOW-PROTOTYPE-USAGE", None)])
    if use_json:
        sys.stdout.write(json_line(output))
    else:
        for item in output["diagnostics"]:
            sys.stdout.write(f'{item["severity"]} {item["code"]}: {item["message"]} file={json_line(item["file"]).strip()} path={json_line(item["path"]).strip()} keyword={json_line(item["keyword"]).strip()}\n')
        if output["success"]:
            sys.stdout.write("Selected local manifest structure is valid; no execution is authorized.\n")
            if "inspection" in output["result"]:
                sys.stdout.write(json_line(output["result"]["inspection"]))
    return output["exitCode"]

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
