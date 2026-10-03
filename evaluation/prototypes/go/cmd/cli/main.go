package main

import (
	"encoding/json"
	"fmt"
	candidate "nexflow.local/go-evaluation"
	"os"
)

func main() {
	arguments := os.Args[1:]
	useJSON := candidate.JSONRequested(arguments)
	command, selection, format, err := candidate.ParseArguments(arguments)
	out := candidate.Usage()
	if err == nil {
		useJSON = format
		schemas, err := candidate.ExecutableSchemas()
		if err != nil {
			out = candidate.Envelope(command)
			out["exitCode"] = 4
			out["diagnostics"] = []map[string]any{candidate.Diagnostic("NEXFLOW-PROTOTYPE-INTERNAL", nil, nil, nil, nil)}
		} else {
			out = candidate.Evaluate(command, selection, schemas)
		}
	}
	var writeError error
	if useJSON {
		bytes, err := candidate.JSONLine(out)
		if err != nil {
			os.Exit(4)
		}
		_, writeError = os.Stdout.Write(bytes)
	} else {
		for _, issue := range out["diagnostics"].([]map[string]any) {
			file, _ := json.Marshal(issue["file"])
			path, _ := json.Marshal(issue["path"])
			keyword, _ := json.Marshal(issue["keyword"])
			_, writeError = fmt.Fprintf(os.Stdout, "error %s: %s file=%s path=%s keyword=%s\n", issue["code"], issue["message"], file, path, keyword)
			if writeError != nil {
				break
			}
		}
		if writeError == nil && out["success"] == true {
			_, writeError = fmt.Fprintln(os.Stdout, "Selected local manifest structure is valid; no execution is authorized.")
			if result, ok := out["result"].(map[string]any); ok && writeError == nil && result["inspection"] != nil {
				bytes, err := candidate.JSONLine(result["inspection"])
				if err != nil {
					os.Exit(4)
				}
				_, writeError = os.Stdout.Write(bytes)
			}
		}
	}
	if writeError != nil {
		os.Exit(4)
	}
	os.Exit(out["exitCode"].(int))
}
