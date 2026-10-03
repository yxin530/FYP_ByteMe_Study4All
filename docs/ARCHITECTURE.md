# AI Study4All System Architecture

## 1. Scope

AI Study4All is the ByteMe group's AI-powered adaptive-learning mobile application. It provides personalized learning activities by analyzing quiz performance, learning activity, strengths, weaknesses, and user-provided learning materials. The project supports SDG 4 by making learning more accessible, engaging, and personalized.

## 2. Technology baseline

| Layer | Technology |
|---|---|
| Mobile app | React Native, TypeScript, Expo Router |
| UI styling | NativeWind / Tailwind CSS |
| API | Node.js, Express.js |
| Authentication | Supabase Auth |
| Database | PostgreSQL through Supabase |
| File storage | Supabase Storage |
| AI | LLM API with coordinated specialist agents |
| Text-to-speech | ElevenLabs |
| Notifications | Firebase Cloud Messaging |
| Source control | Git and GitHub |

## 3. Agent topology

```text
Student
  |
  v
React Native / Expo App
  |
  v
Node.js API
  |
  v
AI Orchestrator
  |---- Learning Profile Agent
  |---- Quiz Agent
  |---- Tutor Agent --------┐
  |---- Material Agent ------┼--> grounded learning content
  |---- Study Rescue Agent --┘
  |---- Study Group Match Agent
  |---- Learning Quest Agent
  `---- Audio Agent ---------> transcript -> ElevenLabs -> audio file
                                      |                 |
                                      v                 v
                                PostgreSQL        Supabase Storage
```

All agents use shared student context, but learning content must remain grounded in the user's uploaded or explicitly supplied materials.

## 4. Adaptive learning loop

```text
Student studies material and completes quizzes
  -> Quiz Agent records answers, difficulty, and outcomes
  -> Learning Profile Agent identifies strengths, weaknesses, and progress
  -> Orchestrator requests targeted explanations, quizzes, quests, or recommendations
  -> Student completes the next learning activity
  -> Profile and performance data are updated
```

The loop supports adaptive quiz difficulty, personalized study recommendations, progress dashboards, and short-term examination preparation through Study Rescue.

## 5. Audio request flow

```text
User requests podcast/audio lesson
  -> API authenticates the user
  -> Orchestrator identifies the audio intent
  -> Audio Agent validates relevant material exists
  -> Tutor/Material Agent produces grounded lesson content
  -> Audio Agent returns transcript immediately
  -> User may review/edit transcript
  -> Audio Agent sends approved transcript to ElevenLabs
  -> Audio is stored in Supabase Storage
  -> Metadata and transcript are stored in PostgreSQL
  -> API returns playback URL and metadata to the app
```

If no relevant material exists, generation must stop and the user must be asked to provide material.

## 6. Shared student context

The shared context may contain:

- subjects and topics
- uploaded material IDs and versions
- quiz history and answer explanations
- strengths, weak topics, and learning progress
- study preferences and availability
- active study plans and notification preferences

It must not be treated as a source of educational facts. Educational answers still require relevant user-provided material.

## 7. Audio data model

Suggested `audio_generations` fields:

- `id`, `user_id`, `request_text`
- `material_ids` and `material_version_hash`
- `transcript`, `transcript_status`
- `voice_id`, `language`
- `storage_path`, `playback_url`, `duration_seconds`
- `created_at`, `updated_at`

The cache key should include the request, relevant material version, generated content hash, voice, and language. Audio binaries belong in Supabase Storage; PostgreSQL stores metadata and references.

## 8. Security and privacy boundaries

- Enforce user ownership checks for materials, transcripts, and audio records.
- Keep ElevenLabs credentials server-side.
- Do not send unrelated student materials to an agent or external provider.
- Apply retention and deletion rules consistently to source material and generated audio.
