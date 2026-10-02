# Go Toolchain Plan

Use Go 1.27.1 with GOTOOLCHAIN=local. [go.mod](go.mod) fixes
github.com/santhosh-tekuri/jsonschema/v6 6.0.2, go.yaml.in/yaml/v3 3.0.4 and the
resolved indirect golang.org/x/text 0.14.0. [go.sum](go.sum) records graph/module
checksums, including dependency test modules selected by go mod tidy.

Provision a task-local Go prefix, GOPATH and GOCACHE; verify the official
native archive receipt in [toolchains.json](../toolchains.json).
Online GOTOOLCHAIN=local go mod download is a separate provisioning step.
Then verify and build without module or compiler fetching:

~~~sh
GOTOOLCHAIN=local GOPROXY=off go mod verify
GOTOOLCHAIN=local GOPROXY=off CGO_ENABLED=0 go build \
  -mod=readonly -trimpath -buildvcs=false -o TASK_OUTPUT .
~~~

From the repository root:

~~~sh
node scripts/runtime-toolchain-probe-run.mjs --candidate go \
  --command '["TASK_OUTPUT"]'
~~~

Replace TASK_OUTPUT with the reviewed executable path. The later artifact
plan uses the same native build command; no cross-build is counted as a native
run or distribution result. No additional archive packager is chosen. Proposed
CLI parsing uses the pinned standard [flag](https://pkg.go.dev/flag) package.

[Go module controls](https://go.dev/ref/mod) enforce the resolved build list and
checksums, not an application sandbox.
[JSON Schema v6](https://github.com/santhosh-tekuri/jsonschema) is set to Draft 2020,
format assertion and a loader rejecting every non-preloaded schema.
[YAML v3](https://pkg.go.dev/go.yaml.in/yaml/v3) is read as nodes:
[main.go](main.go) preserves timestamp text and rejects duplicate/non-string keys.
Alias nodes are unsupported in this probe.

[probe-result.json](probe-result.json) preserves the library adapter's raw
items:false diagnostic (/0, empty keyword). Negative validity passes this
capability check; diagnostic parity with the frozen library catalog does not.
Normalization must be tested later without relaxing that catalog.
