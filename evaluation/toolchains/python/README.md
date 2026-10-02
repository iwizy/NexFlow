# Python Toolchain Plan

Use CPython 3.12.14, not an ambient system interpreter. The CLI plan uses standard
[argparse](https://docs.python.org/3.12/library/argparse.html). The wheel/console
entry-point plan uses build 1.3.0, setuptools 80.9.0, wheel 0.45.1 and pip 26.2.1,
with [build isolation disabled explicitly](https://build.pypa.io/en/stable/):
python -m build --wheel --no-isolation after installing the locked tools.
No package or entry point is released by this preparation task.

[requirements.in](requirements.in) pins the seven direct requirements.
[requirements.lock](requirements.lock) fixes all 15 resolved packages with hashes
of non-yanked wheels for those exact releases; source distributions are excluded.
Native wheel availability is verified only for macOS ARM64/CPython 3.12 here.
Do not silently fall back to source builds or a different interpreter elsewhere.

Create a task-local venv and wheelhouse during provisioning:

~~~sh
python3.12 -m venv TASK_ENV
TASK_ENV/bin/python -m pip download --require-hashes --only-binary=:all: \
  -r requirements.lock --dest TASK_WHEELHOUSE
~~~

Offline installation and validation use only prepared files:

~~~sh
TASK_ENV/bin/python -m pip install --no-index --find-links TASK_WHEELHOUSE \
  --require-hashes --only-binary=:all: -r requirements.lock
TASK_ENV/bin/python -m pip check
~~~

On Windows use TASK_ENV/Scripts/python.exe and the platform's native wheels;
this path adaptation is not evidence of a tested Windows install. From the root:

~~~sh
node scripts/runtime-toolchain-probe-run.mjs --candidate python \
  --command '["TASK_ENV/bin/python","evaluation/toolchains/python/probe.py"]'
~~~

Replace TASK_ENV in the argv with the reviewed task-local executable.
[probe.py](probe.py) runs without a JavaScript validation backend.
[probe-result.json](probe-result.json) is capability evidence, not a CLI result.

[jsonschema referencing](https://python-jsonschema.readthedocs.io/en/stable/referencing/)
uses an explicit local Registry with no retrieval callback, Draft202012Validator
and format assertion; rfc3339-validator 0.1.4 enables the tested date format.
[PyYAML](https://pyyaml.org/wiki/PyYAMLDocumentation) SafeLoader alone does not
provide the required duplicate-key/scalar policy. The probe adds unique string
keys and core-style booleans/string dates. Numeric and alias fidelity remain gaps.

Lock regeneration is provisioning-only: resolve all requirements.in entries in
a clean pinned interpreter with pip's --dry-run --ignore-installed --only-binary=:all:
and --report, then run the helper from the repository root:

~~~sh
node scripts/runtime-toolchain-python-lock.mjs REPORT.json
~~~

The helper retrieves official release wheel hashes and emits a proposed lock;
review, install with hash enforcement and rerun probes before accepting it.
Never commit the raw pip report: it can contain environment-specific paths.
A venv is not an application sandbox.
