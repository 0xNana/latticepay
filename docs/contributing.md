# Contributing

Thanks for your interest in contributing to Lattice Pay.

## Scope
- This repository contains web, API, and contracts packages.
- Keep PRs focused and small (feature + tests + docs together).

## Local Setup
```bash
npm install
npm --workspace apps/web run dev
```

## Quality Checks
```bash
npm run contracts:compile
npm run contracts:test
npm --workspace apps/web run build
```

## PR Expectations
- Clear problem statement and summary of changes.
- Include validation evidence (commands run + key outputs).
- Document any runtime constraints or tradeoffs.
