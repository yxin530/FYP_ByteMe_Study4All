# Agent Backend Implementation

## Recommended design

AI Study4All should use a hybrid architecture:

```text
Expo mobile app
        |
        v
Authenticated Node.js API
        |
        v
Orchestrator service
  |        |          |
  v        v          v
Tutor   Quiz       Audio workflow
skill   skill      skill
  |        |          |
  +--------+----------+
           v
      MCP tool client
           |
           v
Learning Tools MCP Server
  |        |          |
  v        v          v
Supabase  PostgreSQL  ElevenLabs
```

The backend remains responsible for authentication, authorization, routing, grounding, validation, retries, persistence, and business rules. MCP provides a standard interface for selected tools.

## What “skills” should mean in this project

Do not make each agent a giant system prompt. Implement each skill as a small backend module with explicit input, processing, and output:

```text
skills/
  tutorSkill.ts
  quizSkill.ts
  audioSkill.ts
  studyRescueSkill.ts
```

Each skill should contain:

1. A typed request and response schema.
2. A short instruction contract for the model, if an LLM is needed.
3. The deterministic workflow around the model call.
4. Material and user authorization checks.
5. Output validation and source-reference checks.
6. Error handling and an audit event.

Example responsibilities:

```text
audioSkill(request)
  -> verifyUserOwnsMaterials(request.materialIds)
  -> retrieveRelevantMaterial(request)
  -> askTutorForGroundedLesson(request)
  -> validateTranscriptHasSources(result)
  -> returnEditableTranscript(result)
```

The model may help with language generation, but the surrounding code controls what it is allowed to see and what can be saved.

## What the MCP server should contain

Create one narrow Learning Tools MCP Server first. It can expose tools such as:

| MCP tool | Backend responsibility |
|---|---|
| `search_user_material` | Search only materials owned by the authenticated user |
| `read_material_excerpt` | Return bounded excerpts with material IDs and versions |
| `save_audio_metadata` | Persist transcript, source versions, and storage path |
| `generate_speech` | Call ElevenLabs server-side and return generation status |
| `get_learning_profile` | Return permitted profile statistics for the current user |
| `record_quiz_attempt` | Validate and persist a quiz result |

MCP tools should not expose unrestricted SQL, filesystem access, or a generic “execute code” function.

## What should not be placed in MCP

- Authentication policy
- User ownership checks that can be bypassed by a caller
- The complete Orchestrator decision process
- Unvalidated raw database queries
- ElevenLabs secrets
- A tool that lets the model choose arbitrary user IDs

The API should establish the authenticated user context before invoking the Orchestrator or MCP client. Every tool call should receive that context from trusted server code, not from free-form model text.

## Prompts, resources, and tools

MCP supports three useful primitives:

- Prompts: reusable templates, such as an audio-lesson format.
- Resources: controlled context, such as a material excerpt or profile summary.
- Tools: executable operations, such as saving metadata or generating speech.

For this project, use resources for bounded learning content and tools for actions. Keep prompts short and versioned; put important rules in executable backend validation as well.

## Example request flow

```text
POST /api/audio/transcript
  -> authenticate Supabase user
  -> validate request schema
  -> AudioSkill
  -> MCP search_user_material
  -> TutorSkill with returned excerpts
  -> validate source references
  -> return transcript to Expo app
```

```text
POST /api/audio/generate
  -> authenticate user
  -> verify transcript belongs to user and was not changed unexpectedly
  -> AudioSkill
  -> MCP generate_speech
  -> MCP save_audio_metadata
  -> return signed playback URL
```

## Why this satisfies the supervisor's concern

The system is not represented as a prompt-only collection of agents. The important behavior is visible in backend code:

- routing is implemented in the Orchestrator
- source grounding is implemented by material retrieval and validation
- adaptive difficulty is implemented by quiz and profile services
- persistence is implemented by database operations
- audio generation is implemented by an explicit workflow
- MCP is used as a typed, permissioned integration boundary

The prompts remain small supporting components rather than the entire system.

## Security skills placement

Security skills should be shared backend modules used by every agent skill, not separate model personalities. Place them under `server/src/security/` and invoke them at the API boundary, Orchestrator boundary, skill boundary, and MCP tool boundary. See [`SECURITY_AND_PRIVACY.md`](SECURITY_AND_PRIVACY.md) for the control list.
