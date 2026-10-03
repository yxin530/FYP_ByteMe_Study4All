# AI Study4All Development Guide

## Mobile application

The repository now contains an Expo Router starter using Expo SDK 57, React Native 0.86, and React 19.2.3. Install dependencies with `npm install`, then run `npm run start`. Use `npm run typecheck` to validate TypeScript.

Expo SDK 57 requires Node.js 22.13.x or newer within the supported Node 22 line. Verify with `node --version` before installing dependencies.

The mobile app is a client only. It handles screens, navigation, user interaction, and playback. It should not contain model prompts, agent orchestration, database credentials, or ElevenLabs secrets.

## Backend logic

Backend agent logic is fully possible and is the recommended design. The server should authenticate the user, retrieve only that user's materials, invoke the appropriate agent, validate the grounded result, and persist metadata. The Expo app calls the server through `EXPO_PUBLIC_API_URL`.

## Skills and MCP servers

Skills and MCP servers are development or agent-tooling integrations; they do not replace the application backend.

- A Codex skill is a reusable instruction and workflow package for the coding agent. It helps Codex perform tasks such as document processing or project scaffolding.
- An MCP server exposes tools or data to an AI client through a standard protocol. It can connect an agent to approved capabilities such as file search, a database, or a service API.
- Runtime product agents in AI Study4All should be implemented as server modules and API workflows. They may call carefully controlled tools, but the mobile app must access them through authenticated backend endpoints.

Recommended separation:

```text
Expo app -> authenticated API -> Orchestrator -> specialist agent -> approved tool/service
                                      |             |
                                      v             v
                                PostgreSQL      Supabase / ElevenLabs
```

Only add an MCP server when an agent genuinely needs a reusable external tool. Keep permissions narrow, validate every tool input, and never expose unrestricted database or filesystem access to a model.
