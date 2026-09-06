#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpMessage = exports.COMMIT_TYPES = void 0;
exports.validateSubject = validateSubject;
exports.validateScope = validateScope;
exports.validateBreakingDescription = validateBreakingDescription;
exports.buildCommitMessage = buildCommitMessage;
exports.parseOptions = parseOptions;
exports.ensureGitRepository = ensureGitRepository;
exports.hasStagedChanges = hasStagedChanges;
exports.run = run;
const inquirer_1 = __importDefault(require("inquirer"));
const node_child_process_1 = require("node:child_process");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
exports.COMMIT_TYPES = [
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
];
const packageRoot = (0, node_path_1.join)(__dirname, "..");
exports.helpMessage = `Usage: commit-conventional [options]

Interactively create a commit message that follows Conventional Commits.

Options:
  -h, --help       Show this help message.
  -v, --version    Show the installed version.
      --dry-run    Print the generated message without creating a commit.
  -n, --no-verify  Bypass Git hooks when creating the commit.
`;
function trimmed(value) {
    return typeof value === "string" ? value.trim() : "";
}
function validateSubject(input) {
    const value = trimmed(input);
    if (!value)
        return "Subject is required.";
    if (/\r|\n/.test(value))
        return "Subject must be a single line.";
    if (/\0/.test(value))
        return "Subject contains an invalid character.";
    if (value.endsWith("."))
        return "Do not end the subject with a period.";
    if (value.length > 72)
        return "Keep the subject at 72 characters or fewer.";
    return true;
}
function validateScope(input) {
    const value = trimmed(input);
    if (/\r|\n/.test(value))
        return "Scope must be a single line.";
    if (/\0/.test(value))
        return "Scope contains an invalid character.";
    if (value.includes("("))
        return "Scope cannot contain an opening parenthesis.";
    if (value.includes(")"))
        return "Scope cannot contain a closing parenthesis.";
    return true;
}
function validateBreakingDescription(input) {
    const value = trimmed(input);
    if (!value)
        return "A breaking change description is required.";
    if (/\0/.test(value))
        return "Breaking change description contains an invalid character.";
    return true;
}
function buildCommitMessage(answers) {
    const type = trimmed(answers.type);
    const scope = trimmed(answers.scope);
    const subject = trimmed(answers.subject);
    const body = trimmed(answers.body);
    const breaking = answers.breaking === true;
    const breakingDescription = trimmed(answers.breakingDescription);
    if (!exports.COMMIT_TYPES.includes(type)) {
        throw new Error(`Unsupported commit type: ${type || "(empty)"}`);
    }
    const subjectError = validateSubject(subject);
    if (subjectError !== true)
        throw new Error(subjectError);
    const scopeError = validateScope(scope);
    if (scopeError !== true)
        throw new Error(scopeError);
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
function parseOptions(args) {
    const options = {
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
function spawnGit(args, stdio) {
    const result = (0, node_child_process_1.spawnSync)("git", [...args], { stdio });
    if (result.error) {
        const errorCode = result.error.code;
        if (errorCode === "ENOENT") {
            throw new Error("Git is not installed or is not available on PATH.");
        }
        throw new Error(`Unable to run git: ${result.error.message}`);
    }
    return result;
}
function ensureGitRepository() {
    const result = spawnGit(["rev-parse", "--is-inside-work-tree"], "ignore");
    if (result.status !== 0) {
        throw new Error("This command must be run inside a Git repository.");
    }
}
function hasStagedChanges() {
    const result = spawnGit(["diff", "--cached", "--quiet"], "ignore");
    if (result.status === 0)
        return false;
    if (result.status === 1)
        return true;
    throw new Error("Unable to inspect staged changes.");
}
function getVersion() {
    try {
        const packageJson = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.join)(packageRoot, "package.json"), "utf8"));
        return typeof packageJson.version === "string" ? packageJson.version : "unknown";
    }
    catch {
        return "unknown";
    }
}
async function confirmNoStagedChanges() {
    if (hasStagedChanges())
        return true;
    const { confirmProceed } = await inquirer_1.default.prompt([
        {
            type: "confirm",
            name: "confirmProceed",
            message: "No staged changes detected. Commit anyway?",
            default: false,
        },
    ]);
    return confirmProceed;
}
async function promptForCommit() {
    return inquirer_1.default.prompt([
        {
            type: "list",
            name: "type",
            message: "Type",
            choices: exports.COMMIT_TYPES,
        },
        {
            type: "input",
            name: "scope",
            message: "Scope (optional)",
            validate: validateScope,
            filter: (value) => value.trim(),
        },
        {
            type: "input",
            name: "subject",
            message: "Short description (subject)",
            validate: validateSubject,
            filter: (value) => value.trim(),
        },
        {
            type: "editor",
            name: "body",
            message: "Detailed body",
            when: async () => {
                const { addBody } = await inquirer_1.default.prompt([
                    {
                        type: "confirm",
                        name: "addBody",
                        message: "Add a detailed body?",
                        default: false,
                    },
                ]);
                return addBody;
            },
            filter: (value) => value.trim(),
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
            when: (answers) => answers.breaking === true,
            validate: validateBreakingDescription,
            filter: (value) => value.trim(),
        },
    ]);
}
function commit(message, noVerify) {
    const args = ["commit"];
    if (noVerify)
        args.push("--no-verify");
    args.push("-m", message);
    const result = spawnGit(args, "inherit");
    if (result.status === null) {
        throw new Error(`git commit was terminated by ${result.signal ?? "an unknown signal"}.`);
    }
    return result.status;
}
async function run(argv = process.argv.slice(2)) {
    const options = parseOptions(argv);
    if (options.help) {
        console.log(exports.helpMessage);
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
    const { confirm } = await inquirer_1.default.prompt([
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
    run().then((exitCode) => {
        process.exitCode = exitCode;
    }, (error) => {
        if (error && typeof error === "object" && "name" in error && error.name === "ExitPromptError") {
            console.error("Aborted by the user.");
            process.exitCode = 130;
            return;
        }
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error: ${message}`);
        process.exitCode = 1;
    });
}
//# sourceMappingURL=index.js.map