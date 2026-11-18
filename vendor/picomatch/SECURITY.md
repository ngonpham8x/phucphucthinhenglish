# Local picomatch security backport

This private package is based on the published `picomatch@4.0.7` npm package.
It retains the upstream MIT license and CommonJS API. The private package name
identifies the application-maintained fork. Its version records the upstream
baseline.

The local change is in `lib/parse.js`, in the repeated-extglob analysis.
An unescaped, unquoted wildcard `*`, or a nested `+(...)`, inside a
repeated branch can introduce nested unbounded quantifiers. The guard covers
single branches and alternatives, and runs
before the optional recursion-limit override. It uses the upstream safe
character-class simplification for supported star sequences and the upstream
literalization behavior for unsafe patterns. Character classes, escaped stars,
quoted stars, ordinary globs and literal repeated branches retain their behavior.

The regression test runs the `+(*)` and `+(*a)` cases from CVE-2026-112366 in
separate processes with timeouts. It also checks the package resolution used by
Vite, fdir and tinyglobby, and compatibility with application build patterns.

The root npm override directs every `picomatch` consumer to this package.
`tests/build-security.test.mjs` and the normal Vite build verify the integration.

Upstream advisory

https://github.com/advisories/GHSA-fc5q-39xc-vjpf

When an upstream security release becomes available, review that release, remove
the local dependency and override, then run the security regression, full tests,
development-server checks, production build and npm audit before deployment.
