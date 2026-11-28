# AI Study4All

**AI Study4All** is an AI-powered adaptive learning mobile application developed by the **ByteMe** group. It analyzes students' learning performance, identifies their strengths and weaknesses, and delivers personalized explanations, adaptive quizzes, study recommendations, and interactive learning activities based on their own study materials.

The project is aligned with **Sustainable Development Goal 4 (SDG 4): Quality Education**, aiming to make learning more accessible, engaging, and personalized for students.

## Main features

- **User Registration & Authentication**
- **Subject & Topic Management**
- **AI Learning Profile** to identify individual learning patterns, strengths, and weaknesses
- **Snap/Upload-to-Learn** for extracting and learning from uploaded learning materials
- **AI Learning Assistant** for material-grounded explanations of difficult topics
- **Adaptive AI Quiz** that dynamically adjusts question difficulty according to performance
- **“Why Did I Get This Wrong?”** feature to explain incorrect answers
- **AI Study Group Match** to match students with suitable study partners or groups based on subjects, learning needs, weak topics, study preferences, and availability
- **AI Learning Quest** for gamified learning activities
- **AI Study Rescue** for creating short-term study plans before examinations
- **Personalized Study Recommendations**
- **Audio Learning** with transcript review and text-to-speech
- **Live Sync Collaborative Whiteboard** with group chat, shared notes, and grounded AI assistance
- **Learning Progress Dashboard**, quiz history and performance analysis, and study reminders & notifications

## Technology stack

- React Native, TypeScript, and Expo Router
- Node.js and Express.js backend
- Supabase Auth, PostgreSQL, and Supabase Storage
- LLM API for coordinated learning agents
- ElevenLabs for text-to-speech
- Firebase Cloud Messaging for notifications

## Project structure

```text
app/       Mobile screens and navigation
lib/       Shared mobile utilities and API helpers
server/    Backend API and agent services
docs/      Requirements, architecture, development, and report documentation
```

## Getting started

```bash
npm install
npm run start
npm run typecheck
```

To start the backend:

```bash
cd server
npm install
npm run dev
```

## Source-grounded learning

Learning responses are designed to use materials supplied or uploaded by the student. The system should request relevant material when the available content is insufficient. Provider credentials and student data belong on the backend.

## Documentation

- [Report Chapters 1–2](docs/REPORT_CHAPTERS_1_2.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Requirements](docs/REQUIREMENTS.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Agent Documentation](docs/agents/)
