# freebuff-adstrip — build, test, and install
#
# `make` alone builds the binary into ./freebuff-adstrip.
# `make install` copies it into $(BINDIR) (default /usr/local/bin).

BINARY  := freebuff-adstrip
BINDIR  ?= /usr/local/bin
VERSION ?= 1.0.0

# -trimpath strips local filesystem paths from the binary, improving
# reproducibility; -s -w drop the symbol table and DWARF data, cutting the
# binary roughly in half. The result is a single static file with no runtime
# dependencies.
LDFLAGS := -s -w -X main.version=$(VERSION)

.PHONY: all build test vet fmt lint race cover clean install uninstall check

all: build

build:
	go build -trimpath -ldflags "$(LDFLAGS)" -o $(BINARY) .

# `check` is what CI should run: format, vet, and test in one step.
check: fmt-check vet test

test:
	go test ./...

# Race detection is cheap here because the tool is single-threaded, but it
# guards against future refactors introducing shared state.
race:
	go test -race ./...

cover:
	go test -coverprofile=coverage.out ./...
	go tool cover -func=coverage.out | tail -1

vet:
	go vet ./...

fmt:
	gofmt -w .

fmt-check:
	@out="$$(gofmt -l .)"; \
	if [ -n "$$out" ]; then echo "gofmt needed on:"; echo "$$out"; exit 1; fi

lint: fmt-check vet

# Install needs root to write /usr/local/bin.
#
# Run `make install` (NOT `sudo make install`). sudo does not inherit PATH, so
# under `sudo make` the `build` prerequisite would try to run `go` and fail with
# "go: not found" (exit 127). Here make itself runs unprivileged, `go build`
# works normally, and only the two `install` commands are escalated.
#
# On a host where sudo needs a password, either run `make install` and type it
# at the two prompts, or cache credentials first and use:
#     make install SUDO="sudo -n"
#
# If BINDIR is already writable, skip escalation entirely:
#     make install SUDO=
SUDO ?= sudo
install: build
	$(SUDO) install -d $(DESTDIR)$(BINDIR)
	$(SUDO) install -m 0755 $(BINARY) $(DESTDIR)$(BINDIR)/$(BINARY)
	@echo "installed $(DESTDIR)$(BINDIR)/$(BINARY)"

uninstall:
	rm -f $(DESTDIR)$(BINDIR)/$(BINARY)

clean:
	rm -f $(BINARY) coverage.out
