# Vision

NexFlow exists to make AI-assisted software delivery explicit, inspectable, and portable.

AI developer tools increasingly make decisions about code, context, memory, tasks, and workflow state. Each tool currently defines those decisions differently. Teams need a shared language that can describe how work should happen before any runtime executes it.

## Mission

NexFlow provides an open declarative layer for describing, validating, and eventually orchestrating AI developer teams.

The specification should help teams answer:

- Who can participate in this project?
- What are agents responsible for?
- What can each actor do?
- Which context sources may be read?
- What memory may be created or reused?
- Which actions require approval?
- How does work move between actors?
- Which events should be audited?
- Which integrations are involved?

## Non-Goals

NexFlow is not:

- an AI coding agent
- an LLM API wrapper
- a chat application
- a personal productivity assistant
- a provider-specific orchestration runtime
- a replacement for human engineering judgment

## Principles

### Provider Neutral

The specification must not depend on any model provider. OpenAI, Anthropic, Google, OpenRouter, Ollama, local models, and custom providers should all be describable.

### Runtime Neutral

The specification must not depend on TypeScript, Python, Rust, Go, or any other implementation language.

### Human-Centric

Humans remain the final authority. Autonomy must be explicit. Dangerous actions must be visible.

### Auditable

Permissions, events, context access, and workflow state should be inspectable from manifests and logs.

### Open

NexFlow should be useful to hobby projects, open-source communities, startups, enterprises, and researchers.

## Future Ecosystem

The project may later split into:

- **NexFlow Spec**: the language-independent standard.
- **NexFlow Runtime**: reference execution and validation behavior.
- **NexFlow Desktop**: local UX for teams and maintainers.
- **NexFlow Cloud**: hosted coordination, audit, and integration services.

The specification must avoid assumptions that make this split difficult.
