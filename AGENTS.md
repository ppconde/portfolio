# Agent workflow

One feature = one spec = one branch = one worktree = one PR.

## Steps

1. **Spec first.** Copy `specs/_template.md` to `specs/<slug>.md` and fill it in.
   Write no code until a human has approved the spec.
2. **Isolate.** Work on `feat/<slug>` in its own worktree so features never share a checkout:
   `git worktree add ../$(basename "$PWD")-<slug> -b feat/<slug>`
3. **Test each criterion.** For every `ACn` in the spec, write a test with `<slug>/ACn`
   in its name (not in a comment). Watch it fail, then write the least code that makes it pass.
4. **Run `./check`** until it passes. It is the same gate CI runs. If it fails twice on the
   same problem, stop: report what you tried and ask. Do not attempt a third fix.
5. **Open a PR** with the template filled in: each AC mapped to its test and, for anything
   a user can see, a screenshot or recording of it working.
6. **Review in a fresh context.** A reviewer (human or an agent with no memory of the
   implementation) reads only the spec and the diff, and answers: does each test really
   prove its AC, and is there anything in the diff the spec did not ask for?

Bug fix with no spec: write the failing test first, then fix. `./check` still applies.

## Rules

- Build only what the spec says. If the spec turns out wrong, change the spec first, in the same PR.
- Read `ARCHITECTURE.md` before designing a change. If you change the layout, a boundary
  or a decision, update it in the same PR. Do not document what the code already says.
- Reuse before writing. Search the codebase for an existing helper before adding one.
- Delete what you replace. No dead code, no "kept for later".
- No new dependency unless the spec names it.
- No comment that justifies a workaround. Fix the root cause, or stop and ask.
- When the human corrects you, propose a lint rule or test that would have caught the
  mistake and add it to the gate. Do not add a line of prose to this file instead.
- `holdout/` holds tests written by the human to judge your work. Never modify, delete or
  rename a file there. If a holdout test fails, the code is wrong, not the test.
- Never make `./check` pass by editing `check`, raising a budget in `check.conf`, or
  deleting, skipping or loosening a test. If a budget blocks you, stop and ask the human.

## Project notes

<!-- Stack, how to run the app, conventions. Keep it short: agents read this every session. -->
