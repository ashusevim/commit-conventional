#!/usr/bin/env node

import inquirer from "inquirer";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const COMMIT_TYPES = [
    "build",
    "chore",
    "ci",
    "docs",
    "feat",
    "fix",
    "perf",
    "refactor",
    "revert",
    "style",
    "test",
] as const;

export type CommitType = (typeof COMMIT_TYPES)[number];

export interface CommitAnswers {
    type: CommitType;
    scope?: string;
    subject: string;
    body?: string;
    breaking?: boolean;
    breakingDescription?: string;
}

export interface CliOptions {
    dryRun: boolean;
    noVerify: boolean;
    help: boolean;
    version: boolean;
}

const packageRoot = join(__dirname, "..");

export const helpMessage = `Usage: commit-conventional [options]

Interactively create a commit message that follows Conventional Commits.

Options:
  -h, --help       Show this help message.
  -v, --version    Show the installed version.
      --dry-run    Print the generated message without creating a commit.
  -n, --no-verify  Bypass Git hooks when creating the commit.
`;

function trimmed(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

export function validateSubject(input: string): true | string {
    const value = trimmed(input);

    if (!value) return "Subject is required.";
    if (/\r|\n/.test(value)) return "Subject must be a single line.";
    if (/\0/.test(value)) return "Subject contains an invalid character.";
    if (value.endsWith(".")) return "Do not end the subject with a period.";
    if (value.length > 72) return "Keep the subject at 72 characters or fewer.";

    return true;
}

export function validateScope(input: string): true | string {
    const value = trimmed(input);

    if (/\r|\n/.test(value)) return "Scope must be a single line.";
    if (/\0/.test(value)) return "Scope contains an invalid character.";
    if (value.includes("(")) return "Scope cannot contain an opening parenthesis.";
    if (value.includes(")")) return "Scope cannot contain a closing parenthesis.";

    return true;
}

export function validateBreakingDescription(input: string): true | string {
    const value = trimmed(input);

    if (!value) return "A breaking change description is required.";
    if (/\0/.test(value)) return "Breaking change description contains an invalid character.";

    return true;
}

export function buildCommitMessage(answers: CommitAnswers): string {
    const type = trimmed(answers.type);
    const scope = trimmed(answers.scope);
    const subject = trimmed(answers.subject);
    const body = trimmed(answers.body);
    const breaking = answers.breaking === true;
    const breakingDescription = trimmed(answers.breakingDescription);

    if (!COMMIT_TYPES.includes(type as CommitType)) {
        throw new Error(`Unsupported commit type: ${type || "(empty)"}`);
    }

    const subjectError = validateSubject(subject);
    if (subjectError !== true) throw new Error(subjectError);

    const scopeError = validateScope(scope);
    if (scopeError !== true) throw new Error(scopeError);

    if (/\0/.test(body)) {
        throw new Error("Commit body contains an invalid character.");
    }

    if (breaking && !breakingDescription) {
        throw new Error("A breaking change description is required.");
    }

    const header = `${type}${scope ? `(${scope})` : ""}${breaking ? "!" : ""}: ${subject}`;
    const footer = breakingDescription ? `BREAKING CHANGE: ${breakingDescription}` : "";

    return [header, body, footer].filter(Boolean).join("\n\n");
}

export function parseOptions(args: readonly string[]): CliOptions {
    const options: CliOptions = {
        dryRun: false,
        noVerify: false,
        help: false,
        version: false,
    };

    for (const arg of args) {
        switch (arg) {
            case "-h":
            case "--help":
                options.help = true;
                break;
            case "-v":
            case "--version":
                options.version = true;
                break;
            case "--dry-run":
                options.dryRun = true;
                break;
            case "-n":
            case "--no-verify":
                options.noVerify = true;
                break;
            default:
                throw new Error(`Unknown option: ${arg}`);
        }
    }

    return options;
}

function spawnGit(args: readonly string[], stdio: "ignore" | "inherit") {
    const result = spawnSync("git", [...args], { stdio });

    if (result.error) {
        const errorCode = (result.error as NodeJS.ErrnoException).code;
        if (errorCode === "ENOENT") {
            throw new Error("Git is not installed or is not available on PATH.");
        }
        throw new Error(`Unable to run git: ${result.error.message}`);
    }

    return result;
}

export function ensureGitRepository(): void {
    const result = spawnGit(["rev-parse", "--is-inside-work-tree"], "ignore");

    if (result.status !== 0) {
        throw new Error("This command must be run inside a Git repository.");
    }
}

export function hasStagedChanges(): boolean {
    const result = spawnGit(["diff", "--cached", "--quiet"], "ignore");

    if (result.status === 0) return false;
    if (result.status === 1) return true;

    throw new Error("Unable to inspect staged changes.");
}

function getVersion(): string {
    try {
        const packageJson = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as {
            version?: unknown;
        };
        return typeof packageJson.version === "string" ? packageJson.version : "unknown";
    } catch {
        return "unknown";
    }
}

async function confirmNoStagedChanges(): Promise<boolean> {
    if (hasStagedChanges()) return true;

    const { confirmProceed } = await inquirer.prompt<{ confirmProceed: boolean }>([
        {
            type: "confirm",
            name: "confirmProceed",
            message: "No staged changes detected. Commit anyway?",
            default: false,
        },
    ]);

    return confirmProceed;
}

async function promptForCommit(): Promise<CommitAnswers> {
    return inquirer.prompt<CommitAnswers>([
        {
            type: "list",
            name: "type",
            message: "Type",
            choices: COMMIT_TYPES,
        },
        {
            type: "input",
            name: "scope",
            message: "Scope (optional)",
            validate: validateScope,
            filter: (value: string) => value.trim(),
        },
        {
            type: "input",
            name: "subject",
            message: "Short description (subject)",
            validate: validateSubject,
            filter: (value: string) => value.trim(),
        },
        {
            type: "editor",
            name: "body",
            message: "Detailed body",
            when: async () => {
                const { addBody } = await inquirer.prompt<{ addBody: boolean }>([
                    {
                        type: "confirm",
                        name: "addBody",
                        message: "Add a detailed body?",
                        default: false,
                    },
                ]);
                return addBody;
            },
            filter: (value: string) => value.trim(),
        },
        {
            type: "confirm",
            name: "breaking",
            message: "Breaking change?",
            default: false,
        },
        {
            type: "input",
            name: "breakingDescription",
            message: "Breaking change description",
            when: (answers: Partial<CommitAnswers>) => answers.breaking === true,
            validate: validateBreakingDescription,
            filter: (value: string) => value.trim(),
        },
    ]);
}

function commit(message: string, noVerify: boolean): number {
    const args = ["commit"];
    if (noVerify) args.push("--no-verify");
    args.push("-m", message);

    const result = spawnGit(args, "inherit");
    if (result.status === null) {
        throw new Error(`git commit was terminated by ${result.signal ?? "an unknown signal"}.`);
    }

    return result.status;
}

export async function run(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
    const options = parseOptions(argv);

    if (options.help) {
        console.log(helpMessage);
        return 0;
    }

    if (options.version) {
        console.log(getVersion());
        return 0;
    }

    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        throw new Error("Interactive prompts require a TTY.");
    }

    ensureGitRepository();

    if (!(await confirmNoStagedChanges())) {
        console.log("Aborted: no staged changes.");
        return 1;
    }

    const answers = await promptForCommit();
    const message = buildCommitMessage(answers);

    console.log(`\nCommit message:\n---\n${message}\n---`);

    if (options.dryRun) {
        console.log("Dry run: no commit was created.");
        return 0;
    }

    const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
        {
            type: "confirm",
            name: "confirm",
            message: "Create this commit?",
            default: true,
        },
    ]);

    if (!confirm) {
        console.log("Aborted by the user.");
        return 1;
    }

    const exitCode = commit(message, options.noVerify);
    if (exitCode === 0) {
        console.log("Commit created successfully.");
    }

    return exitCode;
}

if (require.main === module) {
    run().then(
        (exitCode) => {
            process.exitCode = exitCode;
        },
        (error: unknown) => {
            if (error && typeof error === "object" && "name" in error && error.name === "ExitPromptError") {
                console.error("Aborted by the user.");
                process.exitCode = 130;
                return;
            }
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Error: ${message}`);
            process.exitCode = 1;
        },
    );
}
