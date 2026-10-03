# AI Study4All Requirements

## 1. Project identity and purpose

- Group name: ByteMe.
- Project title: AI Study4All.
- Product type: AI-powered adaptive-learning mobile application.
- The system must personalize learning activities using student performance, learning activity, strengths, weaknesses, preferences, and user-provided materials.
- The project should support the goals of SDG 4 Quality Education through accessible and personalized learning.

## 2. Functional requirements

### Mobile foundation

- The app must run on iOS and Android through Expo.
- Navigation must use Expo Router.
- Core screens must support authentication, material upload, chat/learning requests, and audio playback.

### Material grounding

- Users must be able to provide learning materials.
- Each material must have an owner, type, processing status, and version identifier.
- Agents must cite or reference the material IDs used to produce an answer internally.
- Agents must refuse or request more material when the available material cannot answer the request.

### Subjects and adaptive learning

- Users must be able to manage subjects and topics.
- The system must maintain quiz history and performance analysis.
- The Learning Profile Agent must identify strengths, weak topics, and progress from learning activity.
- The system must generate personalized study recommendations based on available performance data and materials.
- The system must provide a learning progress dashboard.

### Learning features

- Snap-to-Learn must allow users to upload or capture learning material for extraction and study.
- The AI Learning Assistant must explain difficult topics using grounded material.
- Adaptive AI Quiz must adjust question difficulty based on performance.
- “Why Did I Get This Wrong?” must explain incorrect answers using the relevant material.
- AI Learning Quest must provide gamified learning activities grounded in the selected subject or material.
- AI Study Rescue must create a short-term study plan for an upcoming examination.
- AI Study Group Match must match students using subjects, learning needs, weak topics, study preferences, and availability.
- The system must support study reminders and notifications.

### Audio learning

- Audio generation must start only after an explicit user request.
- The user may request a podcast-style lesson or an audio version of grounded learning content.
- The Audio Agent must obtain lesson content from the Tutor or Material Agent.
- The transcript must be returned before or alongside audio-generation progress.
- The user must be able to review and edit the transcript before audio generation.
- The app must provide playback, pause, seek, replay, and transcript viewing.
- The first release should support a default voice and a small selectable voice list.
- The system may provide summaries, but it must not add unsupported facts.
- Generated audio must be saved for replay when storage succeeds.
- Matching requests may reuse cached audio only when the source and generation parameters match.

### Agent orchestration

- The Orchestrator must classify user intent and delegate to the appropriate specialist.
- Direct Audio Agent routing is allowed for explicit audio requests.
- The Orchestrator must preserve the source-material constraint across delegated calls.
- Agents must return structured errors for missing material, unsupported formats, provider failures, and authorization failures.

## 3. Non-functional requirements

- TypeScript must be used for mobile and server application code.
- Secrets must be stored in environment configuration and never committed.
- User data must be isolated by authenticated user ID.
- Audio generation should expose pending, completed, and failed states.
- API operations should be retry-safe and avoid duplicate audio on repeated requests.
- The UI should remain usable while audio generation is in progress.
- The architecture should permit replacing ElevenLabs without changing the mobile playback contract.

## 4. Initial acceptance criteria

1. A user uploads or provides material.
2. The user requests an audio lesson about a topic in that material.
3. The system produces a grounded transcript and shows its source material reference internally.
4. The user can approve or edit the transcript.
5. ElevenLabs produces audio from the approved transcript.
6. The app plays the stored audio and displays the transcript.
7. A request with no relevant material is rejected with a helpful upload-material message.
8. A repeated matching request reuses the existing audio record rather than creating an unnecessary duplicate.
9. A quiz result updates the student's performance history and can influence a subsequent recommendation or quiz difficulty.
10. A user can upload material through Snap-to-Learn and receive a grounded explanation or quiz from it.

## 5. Project challenges to validate

- Accuracy of learning-performance analysis and personalized recommendations.
- Quality and relevance of AI-generated learning content.
- Reliability of adaptive quiz difficulty.
- Usability of the mobile interface.
- Security and privacy of student information.
- Effectiveness of AI recommendations with test users.

## 6. Out of scope for the first implementation

- Automatic audio recommendations based on learning patterns.
- Podcast series and episode subscriptions.
- Full listening-progress analytics.
- Complex accents, teaching-style customization, or many-language support.
- Interactive spoken quizzes or pauses requiring spoken answers.
