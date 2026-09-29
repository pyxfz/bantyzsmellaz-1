# freebuff-adstrip

Remove the sponsored text ads from a locally installed [Freebuff](https://freebuff.com) CLI.

Freebuff's chat view serves contextual text ads into the transcript. This tool
disables them by rewriting a single byte in the installed executable, with a
hash-verified backup and automatic rollback.

```
$ freebuff-adstrip status

Found 1 Freebuff installation(s).

  [PATCHED] /home/you/.config/manicode/freebuff
      version : 0.1.6 (linux-x64)
      size    : 129.7 MiB
      sha256  : 5ff3376091
      found by: default home
      owner   : you
      gate    : returns false at 99234101

Result: ads disabled in all installs.
```

## Why not just set `adsEnabled: false`?

Because Freebuff ignores it. The CLI exposes an `adsEnabled` setting in
`settings.json` and registers an `/ads:disable` command, but the gate that
reads it is unreachable:

```js
OP = () => { if (RA) return !0; return Jv().adsEnabled ?? !1 }
```

`RA` is the "is this the Freebuff build" flag, computed as
`Z$().FREEBUFF_MODE === "true"`. The binary's own environment shim `Z$()`
hard-codes `FREEBUFF_MODE:"true"` as a **string literal** — it never reads
`process.env.FREEBUFF_MODE` — so `RA` is a compile-time constant `true` and the
settings lookup on the second line can never execute.

Flipping the literal `!0` to `!1` short-circuits the gate to a constant
`false`. See [THEORY.md](THEORY.md) for the full analysis.

## Install

```bash
# from a checkout
make
sudo make install          # -> /usr/local/bin/freebuff-adstrip

# or run it in place, no install required
./freebuff-adstrip status
```

> `sudo make install` works because the Makefile builds as your user and
> escalates only the `install` steps — `sudo` does not inherit `PATH`, so a
> target that re-ran `go build` under `sudo` would fail with `go: not found`.
> If your `sudo` needs a password, run `make install` interactively, or use
> `make install SUDO="sudo -n"` after caching credentials.

The binary is statically linked against the Go standard library and has no
runtime dependencies. It runs on any Linux x86-64 or arm64 host.

## Usage

```
freebuff-adstrip [command] [flags]
```

| Command | Effect |
|---|---|
| `status` | Report every discovered install and whether it is patched. **Default.** |
| `patch` | Back up each binary and rewrite its ad gate. Idempotent. |
| `rollback` | Restore a binary from a backup (newest, or `--backup`). |
| `doctor` | Report whether the patch is still in place and flag risks. |
| `explain` | Print the raw ad-gate text and the detection ladder. |
| `version` | Print the tool version. |
| `help` | Usage. |

| Flag | Effect |
|---|---|
| `--path <p>` | Operate on a specific binary instead of auto-discovery. Repeatable. |
| `--backup <f>` | Backup to roll back from. Default: newest. |
| `--home <d>` | Override the home directory used for discovery. |
| `-n`, `--dry-run` | Report what would change without writing anything. |
| `--keep <N>` | Backups to retain per directory. Default 5. |
| `--strict` | Refuse heuristic matches; only act when the gate was identified structurally. |
| `--json` | Emit a single JSON document. |
| `-v`, `--verbose` | Debug logging on stderr. |
| `--quiet` | Suppress non-error output. |

| Exit code | Meaning |
|---|---|
| `0` | Success, or `status` found every install patched. |
| `1` | Patch/rollback failed, an install is unpatched, or `doctor` found a problem. |
| `2` | Usage error. |

### Typical workflow

```bash
# 1. See what's there.
freebuff-adstrip status

# 2. Preview.
freebuff-adstrip patch --dry-run

# 3. Apply.
freebuff-adstrip patch

# 4. Confirm.
freebuff-adstrip doctor

# 5. Changed your mind.
freebuff-adstrip rollback
```

### Multiple installs

A box can legitimately have several: a `FREEBUFF_CONFIG_DIR` override, a
second Unix account, an XDG relocation. The tool finds all of them:

```bash
$ freebuff-adstrip status
Found 2 Freebuff installation(s).

  [PATCHED] /home/alice/.config/manicode/freebuff
      found by: default home
      owner   : alice

  [ADS ON]  /home/bob/.config/manicode/freebuff
      found by: other account
      owner   : bob

Result: ads disabled in all installs.   # <- actually reports per-install state
```

`patch` fixes every one it finds. To restrict to specific files:

```bash
freebuff-adstrip patch --path /opt/freebuff/freebuff --path /srv/ci/freebuff
```

### Scripting and CI

`status` exits non-zero when any install is unpatched, so it works as a gate:

```bash
#!/bin/bash
# Re-apply the patch after every Freebuff update, then verify.
freebuff-adstrip patch --quiet || exit 1
freebuff-adstrip status --quiet || {
  echo "Freebuff ads reappeared; run: freebuff-adstrip patch" >&2
  exit 1
}
```

```yaml
# GitHub Actions
- name: Keep Freebuff ad-free
  run: |
    curl -fsSL -o /tmp/adstrip https://github.com/you/freebuff-adstrip/releases/latest/download/freebuff-adstrip
    chmod +x /tmp/adstrip
    /tmp/adstrip patch
    /tmp/adstrip doctor
```

JSON output for dashboards:

```bash
freebuff-adstrip status --json | jq '.installs[] | {path, state: .report.state}'
```

## Surviving future updates

The gate's identifiers are regenerated by the minifier on every build, so
`OP`/`RA`/`Jv` in 0.1.0 became `wP`/`GA`/`Tv` in 0.1.6 — different bytes,
different offsets, same bug. Rather than depend on one exact pattern,
detection runs as a **staged ladder**. The first phase that matches wins, and
each phase reports its own confidence.

| Phase | Matches | Confidence | Handles |
|---|---|---|---|
| `1-exact` | `NAME=()=>{if(FLAG)return!0;return SET().adsEnabled??!1}` | certain | 0.1.0 and 0.1.6, any identifier lengths |
| `2-relaxed` | same arrow, body reordered or extended, either operand order | high | hoisted settings read, extra guards, `&&` conditions |
| `3-hoisted` | `function NAME(){...}` instead of an arrow | high | a bundler emitting function declarations |
| `4-heuristic` | an unconditional `return!0` shortly before an `adsEnabled` read, no enclosing function found | heuristic | bodies with nested blocks the structural phases cannot parse |
| `5-fixed` | gate reads the setting with **no** unconditional `true` | certain | the opt-out being fixed upstream |
| `6-absent` | nothing matched | — | file left completely untouched |

Alongside the ladder, a **cross-check** independently confirms the symbol the
gate tests is the very symbol the bundle assigns from `FREEBUFF_MODE`. When it
agrees you get positive evidence the right function was found, not a
coincidence:

```console
$ freebuff-adstrip status
  [PATCHED] /home/you/.config/manicode/freebuff
      gate    : returns false at 99234101
      phase   : 1-exact (certain)
      ident   : gate=wP flag=GA  [flag confirmed = FREEBUFF_MODE symbol]
```

`status --json` exposes the same facts as `phase`, `confidence`, `gateName`,
`flagName`, and `flagCrossChecked`.

**Phase 5 is the interesting one.** If Codebuff ever fixes the opt-out, the
`if (FLAG) return !0` short-circuit disappears and the `adsEnabled` setting
starts working. Patching a byte would then be wrong, so the tool recognises
that shape, refuses to patch, and tells you to use the setting instead.

**When nothing matches**, that is a safe outcome, not a failure: the file is
left untouched and reported `UNKNOWN`. `explain` then prints the raw text
around every `adsEnabled` reference plus the ladder itself, which is everything
you need to add a phase:

```console
$ freebuff-adstrip explain
state=unknown  phase=6-absent  confidence=-

adsEnabled references with context:
  @99234101 .. 99234151
    ...wP=()=>{if(GA)return!1;return Tv().adsEnabled??!1}...

Ladder phases, in order:
  1-exact      certain    exact known gate: ...
  ...
```

To extend the ladder, add a `phase` entry to `ladder` in `patch.go`. The one
invariant to preserve: the pattern must contain `.adsEnabled`, which is the
rare literal the prefilter anchors on. Without it a full regexp walk over
136 MB takes ~19.5 s instead of ~0.6 s.

## Safety model

| Property | How it is guaranteed |
|---|---|
| **Reversible** | A hash-verified backup is created and confirmed *before* any write. |
| **Length-preserving** | `!0` → `!1` is a one-byte in-place `WriteAt`. No truncation, no temp file, no offset shift. |
| **Non-destructive on doubt** | If the gate signature is absent, the file is reported `UNKNOWN` and left untouched. |
| **Idempotent** | Patching an already-patched binary is a no-op. |
| **Verified** | After writing, the file is re-scanned: size unchanged, gate now reads `false`, all sites converted. |
| **Crash-safe** | The write is `fsync`ed; a failure part-way leaves a restorable backup. |

Backups are named so that a directory listing is self-explanatory:

```
freebuff.adstrip-backup.20260929T142652Z.c65016728a.bak
          └── UTC timestamp ──┘ └── first 10 hex of the original sha256 ──┘
```

The fixed-width UTC timestamp means lexical order is chronological order, so
"newest backup" needs no reliance on mtime.

## Verification

The rewrite is provably minimal. On a real 0.1.6 install:

```console
$ cmp -l freebuff.adstrip-backup.20260929T142652Z.c65016728a.bak freebuff
 99234123  60  61          # octal 60='0' -> 61='1'; exactly one byte

$ stat -c%s freebuff      ->  136046720   # unchanged
$ stat -c%s <backup>      ->  136046720

$ dd if=freebuff bs=1 skip=99234101 count=48
wP=()=>{if(GA)return!1;return Tv().adsEnabled??!
                              ^ the only difference

$ freebuff --version
0.1.6                      # still runs
```

## Tests

```bash
make check         # gofmt check + go vet + go test
make test -v       # verbose
make race          # race detector
make cover         # coverage summary
```

The suite builds synthetic fixtures and never touches a real installation:

| Test | What it pins down |
|---|---|
| `TestLadderMatrix` | The contract table: 11 shapes, each expected phase/state/confidence. The single test that fails if ladder coverage regresses. |
| `TestPhase1Exact` | Detection across the real 0.1.0 and 0.1.6 identifier sets, plus extreme name lengths, with the flag cross-check confirmed. |
| `TestPhase2Relaxed` | Reordered bodies, extra guards, `&&` conditions, parenthesised defaults. |
| `TestPhase2PicksCorrectReturnWithMultipleLiterals` | With several `!0` in a body, the *last* one — the return that actually bypasses the setting — is the one rewritten. |
| `TestPhase3FunctionDeclaration` | The `function NAME(){` form. |
| `TestPhase4Heuristic` | Bodies containing nested blocks that defeat the structural phases. |
| `TestPhase5SettingRespected` | A fixed opt-out is never byte-patched. |
| `TestPhase6AbsentAndNeverTouched` | An unrecognised build is never modified. |
| `TestNonFreebuffFileRefusedByStrict` | A file that merely mentions `adsEnabled` is classified heuristic and then refused. |
| `TestGenuinelyUnrelatedFileIsUnknown` | The ladder does not simply match everything. |
| `TestLadderPhasesAreOrdered` | Most-certain-first ordering, so a multi-phase match reports the strongest. |
| `TestEveryPhaseHasPrefilter` | Every phase carries a prefilter that appears in its own pattern. Protects the 32× scan-speed property. |
| `TestPatchedVariantDerivation` | Each phase's "already patched" twin is derived by substitution and cannot drift. |
| `TestPatchedBinaryDetectedAcrossEveryPhase` | Idempotency holds on all rungs, not just phase 1. |
| `TestCrossCheckRejectsUnrelatedFlag` | The cross-check is discriminating, not vacuously true. |
| `TestGateDetection` | Detection across identifier sets and extreme name lengths. |
| `TestPatchOffsetIndependentOfIdentifierLength` | Regression: the rewrite offset comes from the matched text, not a fixed distance. This bug shipped once and corrupted a real binary. |
| `TestSmallFileRejected` | The plausibility floor spares tiny files a full scan. |
| `TestMultipleGateSitesAllReported` | Every gate site is found, so none is left live. |
| `TestAlreadyPatchedDetected` | Idempotency at the detection layer. |
| `TestRewriteIsLengthPreserving` | The core safety invariant. |
| `TestPatchThenRollbackRestoresExactBytes` | Round-trip fidelity. |
| `TestDryRunWritesNothing` | Preview safety. |
| `TestUnknownBuildSkipped` | Unknown builds are refused. |
| `TestBackupPruning` | Retention, and that the newest backup is never pruned. |
| `TestNewestBackupOrdering` | Newest-backup selection. |
| `TestGateAcrossChunkBoundary` | A gate straddling the 8 MiB scan boundary is still found. |

## Known limitations

**Self-updates revert the patch.** Freebuff's launcher checksums the downloaded
archive only at download time; it does not re-verify the extracted binary on
subsequent runs. A self-update or a `bun i -g freebuff` therefore silently
restores the ads. `doctor` warns when it sees a launcher package, and the
workaround is the script in [Scripting](#scripting-and-ci) above.

**Restructured gate → no patch.** The tool matches the gate's *shape*, not its
exact bytes, so it survives the minifier renaming identifiers on every build.
If Codebuff rewrites the gate's logic beyond what the ladder covers, the file
is reported `UNKNOWN` and left alone rather than guessed at. Run `explain` to
get the raw text, then add a phase to `ladder` in `patch.go`.

**Heuristic matches are patched by default.** Phase 4 is an association rather
than a structural identification, so in principle it could match the wrong
thing. It is always labelled `heuristic` in the output, and `--strict` refuses
it outright. Use `--strict` if you would rather decline than guess.

**Linux only.** Discovery assumes the launcher's POSIX layout
(`~/.config/manicode`). The binary itself is portable Go; only the discovery
and binary-name resolution are platform-specific. The patch logic is
architecture-independent and works on arm64 builds unchanged.

**`adsEnabled` left in settings.** The tool does not edit `settings.json`
(`adsEnabled` is inert under the patch, so it is harmless either way). If you
want it off for a non-Freebuff build too, set it yourself.

## Layout

```
freebuff-adstrip/
├── main.go         CLI surface, subcommand dispatch, output rendering
├── patch.go        The detection ladder, scanning, patching, verification
├── discover.go     Locating installs; launcher and settings discovery
├── backup.go       Backup creation, pruning, verification
├── options.go      Flags, logger, formatting helpers
├── usage.go        Help text
├── patch_test.go   Core tests
├── ladder_test.go  Ladder coverage, ordering and safety tests
├── Makefile
├── README.md
└── THEORY.md       How the ads work and why the patch is shaped this way
```

## License

MIT. Provided for personal use and research. You are responsible for complying
with the Freebuff/Codebuff terms of service; this tool exists because the
product ships no working opt-out.
