package candidate

import (
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf8"
)

type InputFailure struct{ Code string }

func (e *InputFailure) Error() string { return e.Code }
func inputError(code string) error    { return &InputFailure{code} }
func failureCode(err error) string {
	var failure *InputFailure
	if errors.As(err, &failure) {
		return failure.Code
	}
	return "NF-DISCOVERY-UNSAFE-SOURCE"
}

// LocalInputs only exposes bounded reads from one explicit directory root.
type LocalInputs struct {
	root      *os.Root
	canonical string
}

func NewLocalInputs(root string) (*LocalInputs, error) {
	if root == "" {
		return nil, inputError("NF-DISCOVERY-UNSAFE-SOURCE")
	}
	resolved, err := filepath.EvalSymlinks(root)
	if err != nil {
		return nil, inputError("NF-DISCOVERY-UNSAFE-SOURCE")
	}
	resolved, err = filepath.Abs(resolved)
	if err != nil {
		return nil, inputError("NF-DISCOVERY-UNSAFE-SOURCE")
	}
	directory, err := os.OpenRoot(resolved)
	if err != nil {
		return nil, inputError("NF-DISCOVERY-UNSAFE-SOURCE")
	}
	return &LocalInputs{directory, resolved}, nil
}
func (inputs *LocalInputs) Close() error { return inputs.root.Close() }
func (inputs *LocalInputs) check(locator string) error {
	if SafeLocator(locator) == "<redacted-source>" {
		return inputError("NF-DISCOVERY-OUTSIDE-ROOT")
	}
	current := ""
	for _, part := range strings.Split(locator, "/") {
		current = filepath.Join(current, part)
		info, err := inputs.root.Lstat(current)
		if err != nil || info.Mode()&os.ModeSymlink != 0 {
			return inputError("NF-DISCOVERY-UNSAFE-SOURCE")
		}
	}
	return nil
}
func (inputs *LocalInputs) Path(locator string) (string, error) {
	if err := inputs.check(locator); err != nil {
		return "", err
	}
	return filepath.Join(inputs.canonical, filepath.FromSlash(locator)), nil
}
func (inputs *LocalInputs) Exists(locator string) (bool, error) {
	if locator != "project.yaml" && locator != "project.yml" {
		return false, inputError("NF-DISCOVERY-UNSAFE-SOURCE")
	}
	_, err := inputs.root.Lstat(locator)
	if os.IsNotExist(err) {
		return false, nil
	}
	if err != nil {
		return false, inputError("NF-DISCOVERY-UNSAFE-SOURCE")
	}
	return true, nil
}
func (inputs *LocalInputs) Read(locator string) (string, error) {
	if err := inputs.check(locator); err != nil {
		return "", err
	}
	if extension := filepath.Ext(locator); extension != ".yaml" && extension != ".yml" {
		return "", inputError("NF-DISCOVERY-UNSAFE-SOURCE")
	}
	before, err := inputs.root.Lstat(locator)
	if err != nil || !before.Mode().IsRegular() {
		return "", inputError("NF-DISCOVERY-UNSAFE-SOURCE")
	}
	file, err := inputs.root.OpenFile(filepath.FromSlash(locator), os.O_RDONLY|readFlags(), 0)
	if err != nil {
		return "", inputError("NF-DISCOVERY-UNSAFE-SOURCE")
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() {
		return "", inputError("NF-DISCOVERY-UNSAFE-SOURCE")
	}
	if info.Size() > 1024*1024 {
		return "", inputError("NF-DISCOVERY-LIMIT-EXCEEDED")
	}
	bytes, err := io.ReadAll(io.LimitReader(file, 1024*1024+1))
	if err != nil || !utf8.Valid(bytes) {
		return "", inputError("NF-DISCOVERY-UNSAFE-SOURCE")
	}
	if len(bytes) > 1024*1024 {
		return "", inputError("NF-DISCOVERY-LIMIT-EXCEEDED")
	}
	return string(bytes), nil
}
