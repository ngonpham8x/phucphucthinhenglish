import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { realpathSync } from "node:fs";

const require = createRequire(import.meta.url);
const picomatch = require("picomatch");
const patchedPath = realpathSync(require.resolve("picomatch"));
assert.equal(
  require("picomatch/package.json").name,
  "@phucphucthinh/picomatch-secure",
);
for (const consumer of ["vite", "tinyglobby", "fdir"]) {
  const consumerRequire = createRequire(require.resolve(consumer));
  assert.equal(
    realpathSync(consumerRequire.resolve("picomatch")),
    patchedPath,
    `${consumer} must load the security backport`,
  );
}

// Isolate each attack pattern so a regression fails with a bounded timeout.
const worker = `const pm=require('picomatch');const options=JSON.parse(process.argv[3]);const matcher=pm(process.argv[1],options);for(let i=0;i<100;i++) matcher(process.argv[2]);`;
for (const options of [{}, { maxExtglobRecursion: false }]) {
  for (const [pattern, input] of [
    ["+(*)", "a".repeat(80) + "/"],
    ["+(*a)", "a".repeat(80) + "!"],
    ["*(*a)", "a".repeat(80) + "!"],
    ["+(*a|b)", "a".repeat(80) + "!"],
    ["+(+(a))", "a".repeat(80) + "!"],
    ["+([ab]*a)", "a".repeat(80) + "!"],
    ["src/+(*a).tsx", "src/" + "a".repeat(80) + "!.tsx"],
    ["+(*(a)|*(b))", "a".repeat(80) + "!"],
  ]) {
    const result = spawnSync(
      process.execPath,
      ["-e", worker, pattern, input, JSON.stringify(options)],
      { timeout: 1500, encoding: "utf8" },
    );
    assert.equal(
      result.error,
      undefined,
      `${pattern} must finish within the timeout`,
    );
    assert.equal(result.status, 0, result.stderr);
  }
}
for (const [pattern, input, expected, options] of [
  ["**/*.{ts,tsx}", "src/components/Header.tsx", true],
  ["**/*.{ts,tsx}", "src/index.css", false],
  ["**/.env*", "src/.env.local", true, { dot: true }],
  ["**/*", "src/.private", false],
  ["**/*", "src/.private", true, { dot: true }],
  ["src/@(app|lib)/*.ts", "src/lib/auth.ts", true],
  ["+(ab)", "abab", true],
  ["*(ab)", "abab", true],
  ["+([ab])", "abba", true],
  ["+([*])", "***", true],
  ["+(a\\*)", "a*a*", true],
  ["+(*(a)|*(b))", "abba", true],
  ["+(*)", "+(*)", true],
])
  assert.equal(
    picomatch(pattern, options)(input),
    expected,
    `${pattern} / ${input}`,
  );
assert.equal(picomatch.isMatch("src/App.tsx", "**/*.tsx"), true);
assert.equal(picomatch.scan("src/**/*.tsx").base, "src");
assert.equal(picomatch.makeRe("**/*.tsx").test("src/App.tsx"), true);
assert.equal(require("picomatch/posix")("**/*.ts")("src/lib/auth.ts"), true);
console.log(
  "Passed: ReDoS cases are bounded, glob matching remains compatible, and all build consumers resolve the patched package.",
);
