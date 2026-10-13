# Commit Conventional

[![npm version](https://img.shields.io/npm/v/commit-conventional.svg)](https://www.npmjs.com/package/commit-conventional)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org/)
[![License](https://img.shields.io/npm/l/commit-conventional.svg)](https://github.com/codingashishdev/conventional-committer/blob/main/LICENSE)

A professional, interactive CLI that helps teams create clean, consistent [Conventional Commits](https://www.conventionalcommits.org/) directly from the terminal.

---

## Project Overview

**Commit Conventional** streamlines commit creation by guiding developers through a structured prompt flow and validating each part of the message before committing.

It is designed for reliability, clarity, and day-to-day developer productivity in real Git workflows.

## Key Highlights

- Interactive terminal-first commit workflow
- Enforces Conventional Commit structure and standards
- Built-in validation for type, scope, subject, body, and breaking changes
- Safe by design: never stages files automatically
- Supports preview mode before creating a commit

## Why This Project Matters

Consistent commit history improves:

- Team collaboration and code review quality
- Changelog generation and release automation
- Long-term repository maintainability

This tool reduces ambiguity and helps teams adopt a disciplined commit culture with minimal friction.

## Requirements

- Node.js 18+
- Git
- Interactive terminal session

## Installation

Use directly without global install:

```sh
npx commit-conventional
```

Or install locally / globally:

```sh
npm install --save-dev commit-conventional
npm install --global commit-conventional
```

## Usage

1. Stage your changes:

```sh
git add .
```

2. Run the CLI:

```sh
npx commit-conventional
```

3. Review and confirm the generated message.

> Tip: run `git diff --cached` before confirming to verify exactly what is staged.

### CLI Options

```text
-h, --help       Show help.
-v, --version    Show the installed version.
    --dry-run    Print the generated message without creating a commit.
-n, --no-verify  Bypass Git hooks for this commit.
```

- `--dry-run` previews the commit message without creating a commit.
- Git hooks run by default.
- Use `--no-verify` only when intentionally bypassing hooks.

## Commit Format

```text
<type>(<optional scope>)<optional !>: <subject>

<optional body>

<optional BREAKING CHANGE footer>
```

Supported commit types:

`build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`

## Programmatic API

```js
const { buildCommitMessage } = require("commit-conventional");

const message = buildCommitMessage({
  type: "fix",
  scope: "api",
  subject: "handle expired sessions",
});
```

## Development

```sh
npm ci
npm test
npm pack --dry-run
```

`npm test` runs a strict TypeScript build and the Node.js test suite.

## License

ISC
