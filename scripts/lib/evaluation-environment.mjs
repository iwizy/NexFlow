export function checkEnvironment(contract, snapshot, requireFrozen = true) {
  const target = contract.targets.find(entry => entry.id === snapshot.target);
  if (!target) return ["unknown-target"];
  const errors = [];
  if (snapshot.platform !== target.platform || snapshot.architecture !== target.architecture) errors.push("wrong-native-target");
  if (snapshot.runnerLabel !== target.runnerLabel) errors.push("wrong-runner-label");
  if (!snapshot.imageVersion || !snapshot.imageOS || !snapshot.osVersion || !snapshot.osBuild
    || !snapshot.cpuModel || !(snapshot.cpuCount > 0) || !(snapshot.memoryBytes > 0)) errors.push("incomplete-environment");
  if (target.platform === "linux" && !snapshot.osVersion.startsWith("24.04")) errors.push("wrong-os-family");
  if (target.platform === "darwin" && (!snapshot.osVersion.startsWith("15.") || snapshot.translated !== false)) errors.push("wrong-os-family-or-translation");
  if (target.platform === "win32" && !snapshot.osCaption.includes("Windows Server 2025")) errors.push("wrong-os-family");
  if (!target.snapshot) {
    if (requireFrozen) errors.push("unfrozen-environment");
  } else {
    for (const field of ["platform", "architecture", "runnerLabel", "imageOS", "imageVersion", "osVersion", "osBuild", "kernel", "libc", "cpuModel", "cpuCount", "memoryBytes", "translated"]) {
      if (snapshot[field] !== target.snapshot[field]) errors.push("environment-drift:" + field);
    }
  }
  return errors;
}
