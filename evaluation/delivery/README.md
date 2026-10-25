# Unsigned Evaluation Delivery

On 2026-10-25 the maintainer delegated technical decisions for NF-102-03…06
and explicitly requested proceeding without unavailable signing accounts or
certificates. The adopted [bounded distribution policy](unsigned-policy.json)
supports only explicitly obtained unsigned evaluation/developer capsules.
It does not pretend to provide Developer ID, notarization, Authenticode publisher
trust, a public product release or permission to disable platform protection.
Public distribution remains an NF-103 gate; historical failed signing criteria
are preserved and are not retroactively marked passed.

The v2 capsule adds the real [verified installer](install.mjs): immutable version
slots, exact regular-file manifests, verify-before-atomic-activation, and refusal
of corrupt updates without changing the active pointer. It is a packaging change,
not a date/collector-only rebuild. The genuine October 20 capsules remain the
previous version, with their exact hashes and actual retained CI artifacts.
Candidate implementation/locks and the frozen specification/corpus stay unchanged.
Windows Python runs the exact base interpreter with the verified venv's locked
site-packages and the shipped [native entry shim](launch-python.py), explicitly
in UTF-8 mode. This avoids a venv redirector subprocess and allows child creation
to remain denied; it does not use a backend in another language. The new installer
also supplies this compatibility shim when executing genuine v1 capsules.

The trusted installer is evaluation tooling, not a manifest command or candidate
runtime capability. A SHA-256 manifest detects corruption against an obtained
expected inventory; it is not a cryptographic publisher trust signature.

Windows offline execution uses a task-scoped capability-free AppContainer,
not environment flags or a shared firewall change. Only owned temporary payload,
runtime and input ACLs are granted read/execute; the profile is deleted afterwards.
Literal ancestor metadata/traversal permissions exclude directory listing and
file contents, have no inheritance, and are removed before profile teardown.
The API and child-policy contracts are documented in
[Microsoft's AppContainer launch guide](https://learn.microsoft.com/en-us/windows/win32/secauthz/implementing-an-appcontainer)
and [process attribute reference](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-updateprocthreadattribute).
Actual positive/denied controls, not these references, determine a native pass.

Run `node scripts/qualification/verify.mjs lifecycle` for installer and stored
record checks. No stored records means no target acceptance.
