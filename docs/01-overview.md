# Overview

## What is Inkfra?

Inkfra is an open-source, browser-based visual canvas that converts architecture diagrams into ready-to-use Terraform infrastructure code. Instead of manually transcribing a diagram into code, engineers draw their cloud setup — resources and the relationships between them — and Inkfra generates validated Terraform modules.

## Problem statement

- Drawing a diagram is natural; transcribing it into IaC is slow and repetitive.
- Manual transcription introduces missed connections and incorrect settings.
- Diagrams drift from deployed systems because they are not the source of truth.

Inkfra addresses these by making the diagram the starting point for code generation, with validation before export.

## Goals

- Provide a drag-and-drop canvas for cloud and DevOps resources.
- Understand relationships, not just resources.
- Generate syntactically valid, provider-aware Terraform.
- Validate diagrams before generation.
- Support import/export for round-tripping.
- Remain provider-agnostic at the core.

## Non-goals (current)

- No live cloud deployment or state management.
- No reverse generation (IaC to diagram) yet.
- No multi-user collaboration or persistence backend.
- No cost estimation.

## Target users

- Students and beginners learning cloud IaC.
- Engineering teams accelerating plan-to-deployment.
- Auditors and reviewers validating architecture.

## Key concepts

- **Resource**: A cloud or DevOps component represented as a node.
- **Relationship (edge)**: A typed connection between resources.
- **Intermediate representation (IR)**: A provider-agnostic JSON model of nodes and edges.
- **Terraform generation**: Translation of the IR into provider-specific HCL.
