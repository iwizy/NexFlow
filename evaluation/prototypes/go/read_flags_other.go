//go:build !linux && !darwin

package candidate

// Root containment remains active; equivalent Windows final-open race tests are pending.
func readFlags() int { return 0 }
