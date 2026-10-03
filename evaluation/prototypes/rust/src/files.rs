//! Bounded regular-file reads; component checks are not an OS sandbox.
use crate::safe_locator;
use std::{fs::{self, OpenOptions}, io::Read, path::{Path, PathBuf}};

pub struct LocalInputs { root: PathBuf }
impl LocalInputs {
    pub fn new(root: &Path) -> Result<Self, &'static str> {
        if root.as_os_str().is_empty() { return Err("NF-DISCOVERY-UNSAFE-SOURCE"); }
        let root = fs::canonicalize(root).map_err(|_| "NF-DISCOVERY-UNSAFE-SOURCE")?;
        if !root.is_dir() { return Err("NF-DISCOVERY-UNSAFE-SOURCE"); }
        Ok(Self { root })
    }
    pub fn path(&self, locator: &str) -> Result<PathBuf, &'static str> {
        if safe_locator(locator) == "<redacted-source>" { return Err("NF-DISCOVERY-OUTSIDE-ROOT"); }
        let mut path = self.root.clone();
        for part in locator.split('/') {
            path.push(part);
            let info = fs::symlink_metadata(&path).map_err(|_| "NF-DISCOVERY-UNSAFE-SOURCE")?;
            if info.file_type().is_symlink() { return Err("NF-DISCOVERY-UNSAFE-SOURCE"); }
        }
        Ok(path)
    }
    pub fn exists(&self, locator: &str) -> Result<bool, &'static str> {
        if !matches!(locator, "project.yaml" | "project.yml") { return Err("NF-DISCOVERY-UNSAFE-SOURCE"); }
        match fs::symlink_metadata(self.root.join(locator)) {
            Ok(_) => Ok(true), Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(false),
            Err(_) => Err("NF-DISCOVERY-UNSAFE-SOURCE"),
        }
    }
    pub fn read(&self, locator: &str) -> Result<String, &'static str> {
        let path = self.path(locator)?;
        if !matches!(path.extension().and_then(|s| s.to_str()), Some("yaml" | "yml")) { return Err("NF-DISCOVERY-UNSAFE-SOURCE"); }
        let before = fs::symlink_metadata(&path).map_err(|_| "NF-DISCOVERY-UNSAFE-SOURCE")?;
        if !before.is_file() { return Err("NF-DISCOVERY-UNSAFE-SOURCE"); }
        let mut options = OpenOptions::new(); options.read(true);
        // Platform constants are intentionally narrow; Windows race isolation is untested.
        #[cfg(target_os = "macos")]
        { use std::os::unix::fs::OpenOptionsExt; options.custom_flags(0x100 | 0x4); }
        #[cfg(target_os = "linux")]
        { use std::os::unix::fs::OpenOptionsExt; options.custom_flags(0x20000 | 0x800); }
        let file = options.open(&path).map_err(|_| "NF-DISCOVERY-UNSAFE-SOURCE")?;
        let info = file.metadata().map_err(|_| "NF-DISCOVERY-UNSAFE-SOURCE")?;
        if !info.is_file() { return Err("NF-DISCOVERY-UNSAFE-SOURCE"); }
        if info.len() > 1024 * 1024 { return Err("NF-DISCOVERY-LIMIT-EXCEEDED"); }
        let mut bytes = Vec::new();
        file.take(1024 * 1024 + 1).read_to_end(&mut bytes).map_err(|_| "NF-DISCOVERY-UNSAFE-SOURCE")?;
        if bytes.len() > 1024 * 1024 { return Err("NF-DISCOVERY-LIMIT-EXCEEDED"); }
        String::from_utf8(bytes).map_err(|_| "NF-DISCOVERY-UNSAFE-SOURCE")
    }
}
