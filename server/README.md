# AI Study4All Backend

The mobile app calls this server. Agent orchestration, database access, LLM calls, and ElevenLabs calls belong here—not in the Expo client.

The recommended implementation is described in [`docs/AGENT_IMPLEMENTATION.md`](../docs/AGENT_IMPLEMENTATION.md). In short, implement agent “skills” as backend modules, keep the Orchestrator in the API service, and connect to a narrow Learning Tools MCP Server for controlled operations.

Security and privacy controls are documented in [`docs/SECURITY_AND_PRIVACY.md`](../docs/SECURITY_AND_PRIVACY.md). They should be implemented as server-side middleware and policy modules, not only as agent prompts.

Recommended first endpoints:

- `POST /api/materials` — upload and register user material
- `POST /api/learn/explain` — grounded Tutor response
- `POST /api/quiz/generate` — grounded adaptive quiz
- `POST /api/audio/transcript` — grounded transcript draft
- `POST /api/audio/generate` — approved transcript to ElevenLabs
- `GET /api/audio/:id` — audio metadata and playback reference

Keep provider keys server-side. The mobile app should receive short-lived or signed playback URLs, never ElevenLabs or database credentials.
