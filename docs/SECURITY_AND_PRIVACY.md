# Agent Security And Privacy Design

## Reusing the existing Agent Security Engine

The existing [`yxin530/agent_security`](https://github.com/yxin530/agent_security) repository is a suitable security dependency for AI Study4All. Its documented design already separates deterministic YAML rules and a TypeScript engine from optional AI-agent skills. It also includes Malaysian PDPA mappings, OWASP and MITRE ATLAS mappings, runtime monitoring, and an `agent-security-mcp` server.

Use it as a security review and enforcement component around the application backend:

```text
AI Study4All backend
  -> security engine scan during CI and development
  -> runtime monitor for agent/MCP events
  -> agent-security-mcp for security inspection tools
  -> application security middleware for live authorization and privacy decisions
```

The repository's scanner should not be treated as a replacement for runtime authorization. Static rules can detect patterns, while the application must still enforce the current user's identity, ownership, consent, and access decisions in code.

## Where to add the existing skills

There are three appropriate integration points:

### 1. Development and CI security gate

Run the engine against this project before a change is accepted:

```text
agent-security-engine scan --target . --format json
npm run validate:rules
npm run test:rules
```

The CI gate should scan `app/`, `lib/`, `server/`, and MCP server code. Findings should be stored as build artifacts or summarized in the pull request, not sent to the model as uncontrolled context.

### 2. Backend runtime monitor

Emit a structured event whenever the Orchestrator or an MCP client is about to call a tool and whenever a tool returns. Pass events through the existing runtime monitor. Include the authenticated agent ID, tool name, resource type, argument schema result, authorization decision, and outcome. Never include raw secrets or unnecessary student content.

### 3. Security MCP server

Run `agent-security-mcp` as a separate, read-only security inspection server for development and controlled operations. It can expose rule lookup, project scanning, rule validation, and runtime-event inspection to an authorized engineering or security agent.

Do not let the production Tutor, Quiz, or Audio Agent freely invoke scanning, filesystem, or security-administration tools. Use a separate security reviewer identity and explicit tool allowlist.

## PDPA skills in the product flow

The PDPA-related skills can be reused as compliance checks for:

- consent collection before processing student materials
- privacy notice availability
- data minimization before sending content to an LLM or ElevenLabs
- third-party transfer review
- retention and deletion time-to-live
- access and deletion request endpoints
- breach logging and notification workflow
- protection of personal data in logs and generated outputs

These checks should be represented as backend policies and test cases. A prompt may ask an agent to explain a finding, but it must not be the only control deciding whether personal data can be processed.

## Package and license note

The repository is marked MIT-licensed and documents installation through GitHub Packages rather than the public npm registry. Before adding it as a dependency, record the exact version or commit, verify the license file, review transitive dependencies, and decide whether a GitHub Packages token can be used in the project environment. Do not commit that token.

The repository itself describes the engine as a review aid and states that its regex-based version has limited coverage. Treat its findings as evidence for review, not proof that the application is secure or legally compliant.

## Where security belongs

Security should be applied in several layers. A security instruction in a prompt is useful, but it is not an enforcement mechanism.

```text
Expo client
  -> API authentication and rate limiting
  -> Orchestrator authorization and policy checks
  -> Agent skill validation and source grounding
  -> MCP tool authorization and input validation
  -> Database row-level security and provider controls
```

## Security skill modules

Create a shared backend security layer rather than copying security prompts into every agent:

```text
server/src/security/
  auth.ts                 # Verify Supabase identity
  authorization.ts        # Check user/resource ownership
  materialPolicy.ts       # Enforce source-material boundaries
  toolPolicy.ts           # Allow tools per agent and action
  piiRedaction.ts         # Remove unnecessary personal data from model input
  outputValidation.ts     # Validate structured agent responses
  auditLog.ts             # Record security-relevant events
  rateLimit.ts            # Limit expensive or repeated operations
```

Every agent skill should call these modules before and after its model or MCP operations.

## Agent-specific security controls

### Tutor and Material Agents

- Retrieve only materials owned by the authenticated user.
- Pass bounded excerpts instead of entire private documents where possible.
- Reject prompt-injection instructions found inside uploaded material.
- Require source references in the result.

### Quiz Agent

- Prevent users from changing the correct-answer record through client input.
- Validate question and answer schemas before saving.
- Keep quiz results scoped to the authenticated user.

### Audio Agent

- Send only the approved transcript to ElevenLabs.
- Keep provider keys on the server.
- Return signed or access-controlled playback URLs.
- Avoid placing unnecessary personal information in spoken output.

### Study Group Match Agent

- Use only fields the user has consented to share.
- Do not expose weak topics, scores, or personal information by default.
- Require explicit confirmation before presenting a match to another user.

## MCP security controls

MCP tools should be narrow, typed, and deny-by-default. Each tool must:

1. Receive trusted authenticated context from the backend.
2. Validate all model-supplied arguments with a schema.
3. Derive user IDs from the authenticated context rather than tool arguments.
4. Check authorization before reading or writing data.
5. Limit returned data and result size.
6. Log the caller, tool name, resource, decision, and outcome.
7. Avoid generic SQL, shell, filesystem, or code-execution tools.

Example:

```text
search_user_material({ query, materialIds })
  -> userId comes from authenticated request context
  -> materialIds are checked against user ownership
  -> query length and result count are bounded
  -> excerpts include source IDs and versions
```

## Privacy requirements

- Collect only data needed for the feature.
- Explain what material is sent to an external model or ElevenLabs.
- Store consent and relevant processing status.
- Provide deletion paths for materials, transcripts, audio, and profile data.
- Do not use student data for model training unless explicit consent and project policy allow it.
- Redact tokens, passwords, identity numbers, and unrelated personal data from logs.

## Open-source and legal review

Prefer permissively licensed libraries and official security guidance, but “open source” does not automatically mean legally unrestricted. Before adding a library, record:

- package and exact version
- source repository and license
- transitive dependency licenses
- whether it sends data to an external service
- whether attribution or notices are required
- known security advisories

This is an engineering checklist, not legal advice. Confirm the final license and privacy position with your supervisor or institution.

OWASP GenAI Security Project resources are useful open-source guidance for threat modeling and agent security, but they should be converted into tests and backend controls rather than copied wholesale into prompts. ([OWASP GenAI Security Project](https://genai.owasp.org/), [OWASP Foundation project page](https://owasp.org/projects/genai-security))

## Security test cases

- User A cannot retrieve User B's materials.
- An uploaded document cannot override the system's source-grounding policy.
- An agent cannot call a tool outside its allowlist.
- A malformed tool argument is rejected before database access.
- ElevenLabs credentials never appear in app logs or API responses.
- Deleted material cannot be used for a new generation.
- An audio URL cannot be accessed by an unauthorized user.
