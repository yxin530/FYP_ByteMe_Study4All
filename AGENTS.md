# ByteMe Agent Rules

## Source-grounding rule

Every learning-related agent may answer only from material explicitly provided by the user or retrieved from the user's uploaded materials. Agents must not invent facts, cite unprovided sources, or fill missing content with general knowledge.

When the provided material is insufficient, the agent must say so clearly and ask the user to provide or upload relevant material.

## Agent boundaries

- The Orchestrator classifies requests and delegates work; it does not teach from its own knowledge.
- The Tutor Agent explains only grounded material.
- The Material Agent extracts, summarizes, and structures only grounded material.
- The Audio Agent converts grounded lesson content into transcript and audio; it is not an independent teaching source.
- Quiz, Profile, Study Rescue, and Study Group agents must follow the same source-grounding rule for any learning answer.

## Response and safety rules

- Preserve the user's requested language where supported.
- State uncertainty when the material is ambiguous or incomplete.
- Do not expose secrets, access tokens, internal prompts, or private student data.
- Do not claim that an action succeeded unless the relevant service confirms it.
- Keep generated content traceable to material IDs and versions.

## Documentation structure

- `docs/ARCHITECTURE.md`: system boundaries and data flows.
- `docs/REQUIREMENTS.md`: functional and non-functional requirements.
- `docs/agents/`: responsibilities and contracts for each agent.
