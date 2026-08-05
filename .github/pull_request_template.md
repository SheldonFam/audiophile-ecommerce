## What this delivers

<!-- Two to four sentences, from a visitor's perspective: what can they now do
     that they couldn't before? Not a file-by-file list. -->

## Tickets

<!-- One line per ticket this branch closes. -->

- [ ] NN — title

## Verified

<!-- Results, not claims. Paste counts and outputs: how many HTML files were
     emitted, how many tests passed, what a status code actually returned.
     "Tested manually" is not verification. -->

## Deliberately deferred

<!-- What a reader might reasonably expect here but won't find, and which
     ticket owns it. Most tickets in this project defer a lot on purpose;
     saying so is how a reviewer tells a gap from an oversight. -->

---

Decisions and their reasoning belong in `docs/adr/`, not in this description —
link to an ADR rather than restating it. Ticket detail lives in
`.scratch/<feature>/issues/`.

- [ ] `pnpm typecheck`, `pnpm lint` and `pnpm test` pass
- [ ] No arbitrary Tailwind values — `grep -rnE '\[[0-9]+px\]|\[#[0-9a-f]{6}\]' src/`
- [ ] Any decision worth keeping is recorded as an ADR, not only here
