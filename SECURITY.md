# Security

## Reporting a vulnerability

Please don't open a public issue for a security problem. Report it privately through GitHub instead:
**[Report a vulnerability](https://github.com/fournee/fournee/security/advisories/new)** (the repo's Security tab →
"Report a vulnerability").

Include what you found, how to reproduce it, and what it could affect. You'll get a reply within a week. Once a fix
is out, we'll credit you in the release notes unless you'd rather stay anonymous.

## What's in scope

Fournée is a front-end toolkit. It runs in your pages and apps, not on a server we operate. Things worth reporting:

- the Electron font handler (`mise-fonts://`) serving anything outside its font folder, or anything that isn't a font
- a recipe (`recipe.json`) or a font file that can inject script or CSS when loaded
- the stores or adapters leaking or overwriting data they shouldn't touch
- a dependency with a known vulnerability that affects how Fournée is used

## Supported versions

Only the latest release gets security fixes.
