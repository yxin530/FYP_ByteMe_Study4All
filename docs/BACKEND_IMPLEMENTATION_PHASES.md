# Backend Implementation Phases

This plan translates the project requirements and agent contracts into staged backend work. Each phase has a completion gate so later work does not depend on unverified assumptions.

## Phase 0 — Documentation and contracts

- Confirm the frontend flows that need real data.
- Define typed request, response, error, and authorization contracts.
- Standardize material IDs, versions, source references, request IDs, and error codes.
- Resolve documentation gaps, including the missing `docs/REPORT_CHAPTERS_1_2.md` reference.

Completion gate: every planned endpoint has a typed contract and a clear ownership rule.

## Phase 1 — Backend foundation

- Establish Express and TypeScript server structure.
- Add environment configuration and safe defaults.
- Add JSON limits, CORS configuration, request IDs, structured errors, and validation.
- Keep provider credentials and database access server-side.
- Expose a health endpoint.

Completion gate: the server starts, `/health` succeeds, malformed requests receive structured errors, and no secrets are committed.

## Phase 2 — Authentication and authorization

- Verify Supabase access tokens on protected routes.
- Create authenticated request context.
- Derive user IDs from verified tokens.
- Enforce resource ownership and plan row-level security.
- Connect the login, registration, password reset, and logout screens.

Completion gate: unauthenticated requests are rejected and users cannot access another user's data.

## Phase 3 — Materials and Snap-to-Learn

- Register material metadata and ownership.
- Add Supabase Storage upload flow.
- Add processing status, type validation, and version hashes.
- Extract supported material text and structure.
- Retrieve bounded, relevant passages.
- Add material listing, detail, processing, and deletion endpoints.

Completion gate: a user can upload material, receive a version identifier, and retrieve only their own material.

## Phase 4 — Grounded Tutor and Material skills

- Implement material retrieval and source-reference validation.
- Implement Material and Tutor skills as typed backend modules.
- Add Orchestrator routing for explanations.
- Add missing-material, unsupported-format, and contradiction handling.
- Add an LLM provider adapter without placing prompts or keys in the mobile app.

Completion gate: tutor responses use only relevant user-owned material and include internal source references.

## Phase 5 — Quiz generation and history

- Implement typed quiz generation and validation.
- Persist quiz sessions, questions, answers, difficulty, and source references.
- Add explicit difficulty adjustment rules.
- Add answer submission and grounded incorrect-answer explanations.

Completion gate: quiz questions are material-grounded, attempts persist, and future difficulty can use recorded performance.

## Phase 6 — Learning profile and progress

- Analyze recorded quiz and activity data.
- Persist strengths, weak topics, progress, confidence indicators, and evidence references.
- Add explainable recommendations.
- Connect the progress and profile screens to real data.

Completion gate: dashboard values and insights come from persisted activity and remain traceable.

## Phase 7 — Audio transcript workflow

- Validate explicit audio requests and material ownership.
- Generate a grounded lesson through the Tutor or Material skill.
- Return a source-referenced editable transcript.
- Persist transcript status, material versions, and transcript revisions.

Completion gate: missing or irrelevant material stops generation and the transcript is available before audio generation.

## Phase 8 — Audio generation and caching

- Add an ElevenLabs provider adapter.
- Keep provider credentials server-side.
- Generate deterministic cache keys from request, source versions, transcript, voice, and language.
- Store audio in Supabase Storage and metadata in PostgreSQL.
- Return pending, completed, failed, and access-controlled playback states.

Completion gate: approved transcripts produce replayable audio, retries are idempotent, and matching requests reuse cached audio.

## Phase 9 — Study Rescue, Learning Quest, and Study Group Match

- Add short-term exam planning with explicit assumptions.
- Add material-referenced gamified activities.
- Add consent-aware study group matching.
- Return structured status, assumptions, and evidence references.

Completion gate: these features respect source grounding, consent, authorization, and privacy boundaries.

## Phase 10 — Notifications and reminders

- Persist notification preferences and device tokens.
- Add Firebase Cloud Messaging integration.
- Add user-controlled reminder scheduling and opt-out handling.

Completion gate: notifications respect preferences and authenticated ownership.

## Phase 11 — Security, privacy, and audit controls

- Add shared authentication, authorization, material policy, tool policy, PII redaction, output validation, audit logging, and rate limiting modules.
- Apply controls at API, Orchestrator, skill, MCP, database, and provider boundaries.
- Add deletion and retention paths.
- Run the documented security checks and review dependencies and licenses.

Completion gate: security tests cover cross-user access, prompt injection, tool allowlists, secrets, deletion, and audio access.

## Phase 12 — Integration and verification

- Replace frontend mocks screen by screen.
- Add loading, empty, retry, and structured error states.
- Test the complete vertical slices on iOS, Android, and web where supported.
- Verify that the UI reports success only after backend confirmation.

Completion gate: the initial acceptance criteria in `docs/REQUIREMENTS.md` are demonstrably satisfied.

## First implementation slice

The first complete vertical slice is:

```text
Backend foundation → authenticated API contract → material upload boundary → grounded tutor boundary
```

Provider integrations, quizzes, audio, notifications, and advanced study features should build on this slice rather than bypassing its ownership and source-grounding controls.
