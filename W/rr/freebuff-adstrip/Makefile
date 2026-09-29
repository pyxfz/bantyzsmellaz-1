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

# `install` needs root to write /usr/local/bin. sudo does not inherit PATH, so
# a `sudo make install` that tries to re-run `go build` would fail with
# "go: not found". The binary is therefore built as the invoking user and only
# the copy is escalated. Override with `make install SUDO= install` to skip
# privilege escalation when BINDIR is already writable.
SUDO ?= sudo
install: build
	install -d $(DESTDIR)$(BINDIR)
	$(SUDO) install -m 0755 $(BINARY) $(DESTDIR)$(BINDIR)/$(BINARY)
	@echo "installed $(DESTDIR)$(BINDIR)/$(BINARY)"

uninstall:
	rm -f $(DESTDIR)$(BINDIR)/$(BINARY)

clean:
	rm -f $(BINARY) coverage.out
