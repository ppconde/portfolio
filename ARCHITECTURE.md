# Architecture

Keep this under a page. It carries intent and reasons; anything that can be a lint rule
or a test belongs in the gate, with one line here pointing to it.

## Layout

<!-- Top-level directories and what each one owns. One line each. -->

## Boundaries

<!-- What may import what, and where each rule is enforced.
     Example: `renderer/` never imports from `main/` (enforced by the lint rule X). -->

## Decisions

<!-- Choices an agent would otherwise undo. A few lines each: what, why, what was rejected.
     Example: No ORM. Queries are plain SQL in `db/` because we need to see every query. -->
