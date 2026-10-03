//go:build linux || darwin

package candidate

import "syscall"

func readFlags() int { return syscall.O_NOFOLLOW | syscall.O_NONBLOCK }
