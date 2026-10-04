#!/bin/sh
set -eu
# Trusted evaluation wrapper, never selected by a manifest.
uid="$1"; gid="$2"; empty="$3"; hidden="$4"; inputs="$5"; reviewed_path="$6"; work="$7"
shift 7
test "$uid" -gt 0
mount --make-rprivate /
mount --bind "$empty" "$hidden"
mount -o remount,bind,ro "$hidden"
mount --bind "$inputs" "$inputs"
mount -o remount,bind,ro "$inputs"
cd "$work"
exec setpriv --reuid "$uid" --regid "$gid" --clear-groups \
  --bounding-set=-all --inh-caps=-all --ambient-caps=-all \
  env -i PATH="$reviewed_path" LANG=C.UTF-8 TZ=UTC PYTHONDONTWRITEBYTECODE=1 "$@"
