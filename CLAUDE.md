Default branch is `master`.
Use `uv run python3` instead of calling `python3` directly.
Shell has `NULL_GLOB` + `nonomatch` — use `find -print` (not `ls glob*`) for file existence checks.
Skip dotfiles in all file discovery: `find Inbox/ -type f -not -name ".*"`. Importer scripts must also skip with `if path.name.startswith("."): continue`.
