# Gut-check animation worker guide

This guide is for a second computer or a fresh worktree with no chat context. It renders one
preassigned batch of the maker's selected final snowflake meshes. It does not regrow crystals,
change solver evidence, or publish a NAS collection.

## What the coordinator sends

The coordinator sends all three of these together:

1. the exact Git commit or branch containing `scripts/gutcheck-animation-queue.ts`;
2. one batch manifest, for example `batch-b.json`; and
3. the matching `RUN-batch-b.cmd` on Windows or `RUN-batch-b.sh` on macOS/Linux.

The exported `gutcheck-animation-queue-v1` JSON is the maker's complete selection. Do not split it
by hand. The coordinator runs the deterministic planner once and assigns exactly one emitted batch
to each computer. Never run the same batch on two computers at the same time.

## One-time prerequisites

- Check out the supplied commit in its own clean worktree.
- Install Node 23.6 or newer and run `npm install` from the repository root.
- Install `ffmpeg` and make sure `ffmpeg -version` succeeds in a terminal.
- Install the repository's Playwright Chromium runtime if it is absent:
  `npx playwright install chromium`.
- Attach the governed `snowcrystal` NAS share. Windows normally mounts it as `S:`; macOS normally
  mounts it at `/Volumes/snowcrystal`. A different absolute mount may be supplied through
  `VCC_NAS_ROOT`. The repository verifies the share marker before reading or writing.

Do not copy meshes out of private folders, edit `docs/nas-assets.json`, or point the worker at an
arbitrary output directory. The batch contains catalogue-authorized logical mesh URLs, and
`--nas-stage` restricts output to this batch's exclusive staging directory.

## Validate the assigned batch

From the repository root, run:

```powershell
node scripts/gutcheck-animation-queue.ts run --batch "C:\path\to\batch-b.json" --dry-run
```

The command must print the batch label, render settings, web mesh format, and every assigned ID,
then exit without writing animation output. Stop and report the error if the manifest, tracked
source record, or repository version is incompatible.

## Render the batch to NAS staging

The generated Windows launcher can be run from the repository root:

```powershell
C:\path\to\RUN-batch-b.cmd
```

Equivalent explicit command:

```powershell
node scripts/gutcheck-animation-queue.ts run --batch "C:\path\to\batch-b.json" --nas-stage
```

On macOS/Linux, run the matching `.sh` launcher from the repository root or use the same explicit
Node command. Each completed item writes under:

```text
<NAS>/_control/staging/gutcheck-animation/<queue-id>/<batch-id>/
  records/<snowflake-id>.json
  videos/<snowflake-id>.mp4
  web/meshes/<snowflake-id>-v2q.bin
  web/meshes/<snowflake-id>-v2q.bin.gz
```

The worker also creates temporary `frames/` and a built `site/`. Frames are removed only after the
video passes the encoded-size check and its result record is written. Completed items are resumed
by identity: rerunning the same batch skips an item only when its record, video, raw web mesh, and
gzip web mesh all exist.

## Monitor and report completion

The foreground terminal prints the current snowflake ID. A successful item ends with `ok <id>` and
its measured video size. If a run stops, leave its batch directory intact and rerun the same command;
do not delete partial frames before diagnosis.

When the process exits successfully, send the coordinator:

- the Git commit used;
- the batch manifest filename and batch label;
- the exact command used;
- the NAS-relative batch directory; and
- any item that was skipped, retried, or failed.

Do not add NAS or `out/` products to Git. The two hosts' generated results do not require a Git
merge because their batch directories are disjoint. Code or documentation changes still use the
normal isolated-worktree Git merge. The coordinator reconciles both batches' result records before
any later immutable collection publication.

## Coordinator: make two batches

The coordinator runs this once against the maker's exported JSON or the loopback mirror:

```powershell
node scripts/gutcheck-animation-queue.ts plan `
  --queue out/gutcheck-animation-queue/selection.json `
  --batches 2
```

This writes `batch-a.json`, `batch-b.json`, and both platform launchers below
`out/gutcheck-animation-queue/<queue-id>/`. Preserve the original exported queue until both batches
have been reconciled.
