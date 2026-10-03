// Trusted native driver receives identities and declarative inputs, never expectations.
package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	candidate "nexflow.local/go-evaluation"
	"os"
)

func run() error {
	if len(os.Args) != 2 {
		return errors.New("invalid arguments")
	}
	schemas, err := candidate.ExecutableSchemas()
	if err != nil {
		return err
	}
	encoded, err := io.ReadAll(io.LimitReader(os.Stdin, 4*1024*1024+1))
	if err != nil || len(encoded) > 4*1024*1024 {
		return errors.New("input budget")
	}
	var entries []map[string]any
	decoder := json.NewDecoder(bytes.NewReader(encoded))
	decoder.UseNumber()
	if err := decoder.Decode(&entries); err != nil {
		return err
	}
	var extra any
	if decoder.Decode(&extra) != io.EOF || len(entries) != 352 {
		return errors.New("invalid packet")
	}
	results := []any{}
	for _, entry := range entries {
		before, err := json.Marshal(entry)
		if err != nil {
			return err
		}
		first, err := candidate.EvaluateLibraryCase(entry, os.Args[1], schemas)
		if err != nil {
			return err
		}
		second, err := candidate.EvaluateLibraryCase(entry, os.Args[1], schemas)
		if err != nil {
			return err
		}
		after, _ := json.Marshal(entry)
		a, _ := json.Marshal(first)
		b, _ := json.Marshal(second)
		if !bytes.Equal(before, after) || !bytes.Equal(a, b) {
			return errors.New("unstable or mutated input")
		}
		results = append(results, first)
	}
	output, err := candidate.JSONLine(results)
	if err != nil {
		return err
	}
	_, err = os.Stdout.Write(output)
	return err
}
func main() {
	if run() != nil {
		fmt.Fprintln(os.Stderr, "Library experiment failed without a result.")
		os.Exit(1)
	}
}
