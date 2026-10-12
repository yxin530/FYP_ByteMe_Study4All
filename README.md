# AI Study4All

AI Study4All is a mobile learning application developed by the ByteMe group. It helps students study through personalized learning activities, AI-assisted explanations, adaptive quizzes, study planning, and progress tracking.

## Main features

- User registration and authentication
- Subject and topic management
- Snap-to-Learn for uploading or capturing learning materials
- AI Learning Assistant for material-grounded explanations
- Adaptive AI Quiz with performance-based difficulty
- “Why Did I Get This Wrong?” answer explanations
- AI Learning Profile for strengths, weaknesses, and progress
- AI Learning Quest for gamified learning activities
- AI Study Rescue for examination preparation
- AI Study Group Match
- Personalized study recommendations
- Audio learning with transcript review and text-to-speech
- Progress dashboard, reminders, and notifications

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
