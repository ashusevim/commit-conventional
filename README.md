# commit-conventional

[![npm version](https://img.shields.io/npm/v/commit-conventional.svg)](https://www.npmjs.com/package/commit-conventional)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org/)
[![License](https://img.shields.io/npm/l/commit-conventional.svg)](https://github.com/codingashishdev/conventional-committer/blob/main/LICENSE)

An interactive CLI for creating [Conventional Commits](https://www.conventionalcommits.org/) with Git.

## Requirements

- Node.js 18 or newer
- Git
- An interactive terminal

## Installation

Run it without installing globally:

```sh
npx commit-conventional
```

Or install it in a project or globally:

```sh
npm install --save-dev commit-conventional
npm install --global commit-conventional
```

## Usage

Stage changes, then start the prompt:

```sh
git add .
npx commit-conventional
```

The CLI checks that it is running in a Git repository, validates the commit type, scope, subject, body, and breaking-change description, then displays the complete message before asking for confirmation.

It never stages files automatically. Review the staged index with `git diff --cached` before confirming a commit.

### Options

```text
-h, --help       Show help.
-v, --version    Show the installed version.
    --dry-run    Print the generated message without creating a commit.
-n, --no-verify  Bypass Git hooks for this commit.
```

`--dry-run` is useful for reviewing the generated message. Git hooks run by default; use `--no-verify` only when intentionally bypassing them.

The command must run from an interactive terminal. Use `--help` or `--version` in scripts and CI; commit creation is intentionally interactive.

## Commit format

The generated message follows this shape:

```text
<type>(<optional scope>)<optional !>: <subject>

<optional body>

<optional BREAKING CHANGE footer>
```

Supported types are `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, and `test`.

- `build` — changes to the build system or dependencies
- `chore` — maintenance work that does not change application behavior
- `ci` — continuous-integration configuration
- `docs` — documentation-only changes
- `feat` — a new feature
- `fix` — a bug fix
- `perf` — a performance improvement
- `refactor` — code restructuring without behavior changes
- `revert` — reverting an earlier commit
- `style` — formatting or style-only changes
- `test` — adding or updating tests

## Programmatic API

The package entry point also exposes the message builder for integrations:

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

`npm test` performs a strict TypeScript build and runs the Node.js test suite. The `prepack` lifecycle builds the CLI before npm creates a tarball, while `prepublishOnly` runs the full test gate. The package publishes only the compiled CLI, declarations, source map, README, and license.

## Publishing

The package name is unscoped and already belongs to an npm account. To publish a new version, authenticate as the package owner or as a collaborator with publish access:

```sh
npm login --registry=https://registry.npmjs.org/
npm whoami
npm publish --access public
```

If `npm publish` returns `E404` for the registry `PUT` request, npm is usually hiding an authentication or permission failure. Confirm that `npm whoami` is the expected account and ask the current owner to grant access before retrying:

```sh
npm owner ls commit-conventional
npm owner add YOUR_NPM_USERNAME commit-conventional
```

Do not publish credentials or auth tokens in the repository. The local tarball can be inspected safely with `npm pack --dry-run` before publishing.

## License

ISC
