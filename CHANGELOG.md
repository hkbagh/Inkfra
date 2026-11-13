# Changelog

## 0.2.0-alpha.3

### Patch Changes

- afbdb17: Document CI/CD operations, including repository secrets, pull request and changeset steps, manual CI and deploy dispatch, alpha and stable release flows, desktop builds, and workflow recovery commands.
- 5ff9029: Polish the canvas UI with a refreshed theme, an example projects dialog, clearer empty states, and improved toolbar, sidebar, node, and properties layouts. Remove the Slack theme.

## 0.2.0-alpha.2

### Patch Changes

- b25284c: Bundle the Windows and Linux desktop executables with their web assets and publish both from tagged releases.
- 05aa56b: Harden Cloudflare deployment workflows, validate token access to the target Worker service before deploys, and document stale build-token, disconnected-Git-account, and service-scope recovery.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0-alpha.1] - 2026-11-11

### Added

- Cloudflare Workers deployment with CI/CD.
- Node SEA Windows executable (`inkfra.exe`).
- Electron wrapper and desktop build workflow.
- Site deployment plan and GitHub Pages workflow.

## [0.1.1] - 2026-11-09

### Added

- Changelog system using Changesets.
- CI, tests, documentation, and open-source governance files.

### Changed

- Version bump to 0.1.1.

## [0.1.0] - 2026-11-09

### Added

- Initial visual-to-IaC canvas implementation.
- 100+ resource catalog across AWS, Azure, GCP, Kubernetes, Docker, and more.
- Terraform code generation with reference wiring.
- Validation, import/export, documentation, tests, CI, and open-source governance.
