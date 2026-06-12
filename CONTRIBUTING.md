# Contributing to LancerLink

Thanks for considering contributing! Here's how to get started.

## Getting Started

1. Fork the repo
2. Clone your fork: `git clone https://github.com/your-username/lancerlink.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
5. Run the dev server: `npm run dev`

## Development Workflow

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes
3. Run lint: `npm run lint`
4. Run build: `npm run build`
5. Commit using conventional commits (see below)
6. Push and open a PR

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add file upload progress indicator
fix: resolve 404 on empty project list
refactor: extract SVG icons to shared component
docs: update API reference
chore: bump dependencies
```

## Code Style

- All JavaScript/JSX files go through ESLint (`npm run lint`)
- Use functional components with hooks
- Prefer immutable patterns (spread, map, filter — never mutate)
- Keep components focused (<400 lines), extract utilities early

## Pull Request Process

1. Ensure lint and build pass
2. Update README or docs if adding features
3. PRs require at least one review
4. Squash merge into main

## Questions?

Open a [discussion](https://github.com/your-username/lancerlink/discussions).
