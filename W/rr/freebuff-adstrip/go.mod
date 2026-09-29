// Module for freebuff-adstrip: a self-contained, dependency-free utility that
// removes the sponsored-text-ad subsystem from a locally installed Freebuff CLI
// binary.
//
// The module intentionally has zero third-party requirements so it can be
// vendored, audited, and built on an air-gapped machine with nothing but a Go
// toolchain:
//
//	go build -trimpath -ldflags="-s -w" -o freebuff-adstrip .
module freebuff-adstrip

// The language version is pinned lower than the toolchain that develops it so
// the binary keeps building on older Go releases.
go 1.24
