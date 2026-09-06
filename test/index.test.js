const assert = require("node:assert/strict");
const { it } = require("node:test");

const {
    buildCommitMessage,
    parseOptions,
    validateBreakingDescription,
    validateScope,
    validateSubject,
} = require("..");

it("builds a conventional commit with scope, body, and breaking footer", () => {
    assert.equal(
        buildCommitMessage({
            type: "feat",
            scope: " auth ",
            subject: "add login",
            body: "Explain why the login flow changed.",
            breaking: true,
            breakingDescription: "The old login endpoint was removed.",
        }),
        "feat(auth)!: add login\n\nExplain why the login flow changed.\n\nBREAKING CHANGE: The old login endpoint was removed.",
    );
});

it("does not rewrite punctuation in a valid subject", () => {
    assert.equal(
        buildCommitMessage({ type: "fix", subject: "handle \"quoted\" input" }),
        'fix: handle "quoted" input',
    );
});

it("validates conventional commit fields", () => {
    assert.equal(validateSubject(""), "Subject is required.");
    assert.equal(validateSubject("finish this."), "Do not end the subject with a period.");
    assert.equal(validateSubject("line one\nline two"), "Subject must be a single line.");
    assert.equal(validateSubject("add a feature"), true);
    assert.equal(validateScope("api:v2"), true);
    assert.equal(validateScope("api"), true);
    assert.equal(validateBreakingDescription(""), "A breaking change description is required.");
});

it("parses supported CLI options and rejects unknown options", () => {
    assert.deepEqual(parseOptions(["--dry-run", "-n"]), {
        dryRun: true,
        noVerify: true,
        help: false,
        version: false,
    });
    assert.throws(() => parseOptions(["--wat"]), /Unknown option: --wat/);
});
