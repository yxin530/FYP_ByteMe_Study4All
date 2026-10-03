# Audio Agent

## Responsibility

Convert grounded learning content into a transcript and ElevenLabs audio output. The Audio Agent is an output specialist, not an independent teaching agent.

## Activation

Activate only when the user explicitly requests audio, a podcast, spoken teaching, or an audio version of learning content.

## Workflow

1. Validate the authenticated user and relevant material references.
2. Stop if no relevant user-provided material is available.
3. Request grounded lesson content from the Tutor or Material Agent.
4. Return the transcript immediately with source references and an editable state.
5. Accept the approved or edited transcript.
6. Check the cache key before calling ElevenLabs.
7. Generate audio using the selected/default voice.
8. Save the audio binary in Supabase Storage.
9. Save transcript, metadata, source versions, and storage reference in PostgreSQL.
10. Return a playback-safe URL and generation status.

## Contract

```text
Input:
  user_id, request_text, material_ids, material_version_hashes,
  voice_id?, language?, transcript_revision?

Output:
  generation_id, transcript, source_references,
  audio_status, playback_url?, duration_seconds?, limitations
```

## Constraints

- Do not create lesson facts independently.
- Do not generate audio when the source material is missing or irrelevant.
- Do not expose ElevenLabs credentials to the client.
- Make retries idempotent using a deterministic request/cache key.
- Mark provider and storage failures clearly; do not report success early.
