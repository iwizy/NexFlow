# Licensing And Patent Rationale

Status: Accepted for the `0.1` specification phase

NexFlow remains licensed under the MIT License during the current
specification-first phase. This decision records the present tradeoff; it does
not change the repository license.

This document is project governance guidance, not legal advice.

## Current Decision

The MIT License remains the project license for `0.1` development.

The current repository publishes specifications, schemas, examples, fixtures,
and repository validation tooling. It does not ship a reference runtime, SDK,
provider integration, extension loader, or production CLI. For this scope, MIT
keeps reuse and contribution terms short, familiar, and consistent with the
license already applied to the repository and its accepted contributions.

The decision is deliberately limited to the current phase. It is not a claim
that MIT is necessarily the right license for every future NexFlow executable,
SDK, or separately distributed component.

## Why Apache-2.0 Was Considered

Apache License 2.0 includes an explicit patent license from each contributor
for patent claims necessarily infringed by that contributor's contribution. It
also terminates that patent license for a party that brings specified patent
litigation over the work. The MIT License grants broad software permissions,
but its text does not contain an equivalent express patent grant.

That difference may become material when NexFlow gains executable
implementations, corporate contributors, or adoption environments that require
an explicit patent posture.

Apache-2.0 also introduces longer terms and additional redistribution
obligations, including notices for modified files and preservation of relevant
notices. Those obligations are manageable, but adopting them is a project-wide
licensing decision rather than a documentation cleanup.

## Why The License Is Not Changing Now

- The repository is still specification-first and does not distribute a
  runtime or SDK.
- Existing repository notices and contribution terms consistently name MIT.
- A license change requires an inventory of copyright ownership and accepted
  contributions; maintainers must not assume they can relicense every existing
  contribution.
- The project does not yet have evidence that the additional patent language
  outweighs the migration and contributor-consent work.

Keeping MIT now avoids pretending that a legally meaningful migration can be
performed by replacing one text file.

## Mandatory Review Triggers

Maintainers must reopen the MIT versus Apache-2.0 decision before any of these
events:

- publishing the first reference runtime, SDK, executable CLI, provider
  integration, or extension loader
- accepting substantial contributions from new corporate or institutional
  copyright holders
- receiving a credible patent concern or an enterprise requirement for an
  explicit patent license
- defining the licensing and governance contract for `1.0`
- splitting NexFlow into separately distributed components whose risk and
  adoption profiles differ

## Review Procedure

A future review must:

1. Inventory repository copyright holders and contribution terms.
2. Identify which existing material can be relicensed and whose consent is
   required.
3. Compare the license needs of the specification, schemas, validation tools,
   and any executable components separately.
4. Obtain qualified legal review before making patent-risk claims or changing
   licenses.
5. Record the decision in an RFC or an equivalent public maintainer decision,
   including compatibility, notice, and migration consequences.
6. Update `LICENSE`, contribution terms, package metadata, documentation, and
   release notes only after that decision is accepted.

Until such a review is completed, contributions remain governed by the MIT
License and no document should imply that NexFlow provides an Apache-2.0 patent
grant.

## Primary References

- [The MIT License](https://opensource.org/license/mit)
- [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0)
