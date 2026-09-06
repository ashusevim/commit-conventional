#!/usr/bin/env node
export declare const COMMIT_TYPES: readonly ["build", "chore", "ci", "docs", "feat", "fix", "perf", "refactor", "revert", "style", "test"];
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
export declare const helpMessage = "Usage: commit-conventional [options]\n\nInteractively create a commit message that follows Conventional Commits.\n\nOptions:\n  -h, --help       Show this help message.\n  -v, --version    Show the installed version.\n      --dry-run    Print the generated message without creating a commit.\n  -n, --no-verify  Bypass Git hooks when creating the commit.\n";
export declare function validateSubject(input: string): true | string;
export declare function validateScope(input: string): true | string;
export declare function validateBreakingDescription(input: string): true | string;
export declare function buildCommitMessage(answers: CommitAnswers): string;
export declare function parseOptions(args: readonly string[]): CliOptions;
export declare function ensureGitRepository(): void;
export declare function hasStagedChanges(): boolean;
export declare function run(argv?: readonly string[]): Promise<number>;
