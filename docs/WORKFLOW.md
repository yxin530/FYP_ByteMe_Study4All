# AI Study4All — System & User Workflows

This document visualizes the end-to-end workflows of **AI Study4All** based on [System Architecture](ARCHITECTURE.md).

---

## 1. End-to-End System & Agent Workflow

```mermaid
flowchart TD
    Student([Student]) --> App[React Native / Expo Mobile App]
    App -->|REST API + Auth| API[Node.js / Express Backend]
    API --> Orch[AI Orchestrator\nClassifies intent & enforces source-grounding]

    Orch --> Material[Material Agent\nExtract & index uploads]
    Orch --> Tutor[Tutor Agent\nGrounded explanations]
    Orch --> Quiz[Quiz Agent\nAdaptive quiz & wrong-answer review]
    Orch --> Rescue[Study Rescue Agent\nExam crash plans]
    Orch --> Profile[Learning Profile Agent\nStrengths, weaknesses & progress]
    Orch --> Quest[Learning Quest Agent\nGamified activities]
    Orch --> Group[Study Group Match Agent\nPartner & group matching]
    Orch --> Audio[Audio Agent\nTranscript & TTS]

    Material --> Grounded[(Grounded Material\nIDs & Versions)]
    Tutor --> Grounded
    Quiz --> Grounded
    Rescue --> Grounded

    Audio -->|1. Generate transcript| Tutor
    Audio -->|2. Approved transcript| ElevenLabs[ElevenLabs TTS]
    ElevenLabs -->|3. Audio file| Storage[(Supabase Storage)]
    Audio -->|Metadata & transcript| DB[(Supabase PostgreSQL)]

    API --> Auth[Supabase Auth]
    API --> DB
    API --> Storage
    API --> FCM[Firebase Cloud Messaging]
```

---

## 2. Adaptive Learning Loop

```mermaid
flowchart LR
    A[Student studies uploaded material] --> B[Completes Adaptive Quiz]
    B --> C[Quiz Agent records answers,\ndifficulty & outcomes]
    C --> D[Learning Profile Agent updates\nstrengths, weaknesses & progress]
    D --> E[Orchestrator recommends next\nexplanation, quiz, quest, or rescue plan]
    E --> A
```

---

## 3. Audio Learning Request Flow

```mermaid
sequenceDiagram
    actor Student
    participant App as Mobile App
    participant API as Backend API
    participant Orch as AI Orchestrator
    participant Audio as Audio Agent
    participant Grounded as Material / Tutor Agent
    participant EL as ElevenLabs
    participant Store as Supabase (DB + Storage)

    Student->>App: Request audio/podcast lesson
    App->>API: Authenticated request
    API->>Orch: Classify audio intent
    Orch->>Audio: Validate relevant material exists
    alt No relevant material
        Audio-->>App: Stop & ask user to upload material
    else Material exists
        Audio->>Grounded: Produce grounded lesson content
        Grounded-->>Audio: Grounded content
        Audio-->>App: Return transcript for review/edit
        Student->>App: Approve transcript
        App->>Audio: Trigger TTS generation
        Audio->>EL: Send approved transcript
        EL-->>Audio: Audio binary
        Audio->>Store: Save audio (Storage) & metadata (PostgreSQL)
        Store-->>App: Return playback URL & metadata
    end
```

---

## 4. Collaborative Whiteboard & Grounded AI Flow

```mermaid
flowchart TD
    Owner[Group Owner] -->|Create or attach Study Group| WB[Whiteboard Group\nMembership, Chat & Shared Notes]
    Member[Group Member] -->|Edit Markdown Notes| Save[Save with expected revision]
    Save -->|Atomic DB function| Rev[(Append-only Revision\n+ Updated Document)]
    Member -->|Poll for updates| WB
    Member -->|Ask AI / Request Edit| Select[Select owned ready materials]
    Select --> AI[Grounded AI\nUses active note + selected passages]
    AI -->|Proposed edit| Review{Explicitly accepted?}
    Review -->|Yes| Save
    Review -->|No| Discard[Discard proposal]
```
