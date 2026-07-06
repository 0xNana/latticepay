# Contributing

Thanks for your interest in contributing to Lattice Pay.

## Scope
- This repository contains frontend and contracts projects.
- Keep PRs focused and small (feature + tests + docs together).

## Local Setup
```bash
npm install
npm --workspace frontend run dev
```

## Quality Checks
```bash
npm run contracts:compile
npm run contracts:test
npm --workspace frontend run build
```

## PR Expectations
- Clear problem statement and summary of changes.
- Include validation evidence (commands run + key outputs).
- Document any runtime constraints or tradeoffs.
