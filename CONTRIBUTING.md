# Contributing to Fournée

Thank you for your interest in contributing to Fournée. We welcome contributions that improve our theming toolkit, from design system components to delivery exports.

## Getting Started

### Prerequisites
- Node.js 20+ (Node 24 is preferred for testing).
- Optional: Python with `pywebview`, `fontTools`, and `PyQt5` for the Python delivery tests.
- Optional: an Electron binary for the Electron test (set `ELECTRON_PATH` in a local `.env`; see `.env.example`).

Optional tests skip when their tools are missing.

### Installation
Install dependencies for specific components using the root scripts:
- `npm run install:frosting`
- `npm run install:fontdant` (installs Playwright Chromium and Firefox)
- `npm run install:delivery`

Run `npm test` to execute the build and test suite for all components, and `npm run playground` to see the panel on a sample page.

## Contribution Rules

### Core Principles
- **Role-Based Design**: A page must never name a specific color or font; it must name a role. New roles require a short proposal in a new issue before implementation.
- **Accessibility**: Contrast contracts must always pass. No text should be smaller than 12px.
- **ADRs**: Any design decision that changes behavior must be documented as an Architecture Decision Record (ADR) in `docs/decisions/`.

### Development Workflow
- **Source Integrity**: Never edit files in any `*/dist/` directory by hand. Edit the source files and rebuild.
- **PR Size**: Keep Pull Requests small and focused on a single topic.
- **Testing**: Every PR must include tests and pass `npm test`.
- **Documentation**: Describe visual changes using before/after screenshots in the PR description.

### Licensing and Files
- **Fonts**: Any fonts added to `fontdant/fonts/` must be OFL or similarly open, and must include a `LICENSE.txt` file.
- **License**: By contributing, your work is licensed under the MIT license.

## Submission Guidelines
- **Commit Messages**: Use a short imperative summary for the first line.
- **Security**: Report security issues privately as outlined in `SECURITY.md`.
- **Conduct**: Please follow the `CODE_OF_CONDUCT.md` and be kind to all contributors.
