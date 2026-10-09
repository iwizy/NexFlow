//! Trusted native experiment driver receives identities and inputs, never expected results.
use nexflow_rust_evaluation::{SchemaEngine, evaluate_library_case};
use serde_json::Value;
use std::{io::{self, Read}, path::PathBuf};
fn run() -> Result<(), &'static str> {
    let args: Vec<_> = std::env::args().skip(1).collect(); if args.len() != 1 { return Err("invalid arguments"); }
    let root = PathBuf::from(&args[0]);
    let schemas = SchemaEngine::bundled()?;
    let mut bytes = Vec::new(); io::stdin().take(4 * 1024 * 1024 + 1).read_to_end(&mut bytes).map_err(|_| "invalid input")?;
    if bytes.len() > 4 * 1024 * 1024 { return Err("input budget"); }
    let packet: Vec<Value> = serde_json::from_slice(&bytes).map_err(|_| "invalid JSON")?;
    if packet.is_empty() || packet.len() > 4096 { return Err("invalid catalog"); }
    let mut results = Vec::new();
    for entry in packet {
        let before = entry.clone();
        let first = evaluate_library_case(&entry, &root, &schemas)?;
        let second = evaluate_library_case(&entry, &root, &schemas)?;
        if first != second || before != entry { return Err("unstable or mutated input"); } results.push(first);
    }
    println!("{}", Value::Array(results)); Ok(())
}
fn main() { if run().is_err() { eprintln!("Library experiment failed without a result."); std::process::exit(1); } }
