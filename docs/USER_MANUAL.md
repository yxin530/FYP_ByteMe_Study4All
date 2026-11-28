# AI Study4All — User Manual

Welcome to **AI Study4All**, an AI-powered adaptive learning mobile application developed by the **ByteMe** group. AI Study4All analyzes your learning performance, identifies your strengths and weaknesses, and delivers personalized explanations, adaptive quizzes, audio lessons, and study plans grounded strictly in your own uploaded study materials.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Navigation Overview](#2-navigation-overview)
3. [Managing Subjects & Study Materials](#3-managing-subjects--study-materials)
4. [AI Learning Assistant (Tutor)](#4-ai-learning-assistant-tutor)
5. [Adaptive AI Quiz & Mistake Review](#5-adaptive-ai-quiz--mistake-review)
6. [Audio Learning](#6-audio-learning)
7. [Study Plan & AI Study Rescue](#7-study-plan--ai-study-rescue)
8. [Learning Progress Dashboard](#8-learning-progress-dashboard)
9. [Collaborative Whiteboard & Study Groups](#9-collaborative-whiteboard--study-groups)
10. [AI Learning Quest](#10-ai-learning-quest)
11. [Profile, Learning Profile & Notifications](#11-profile-learning-profile--notifications)
12. [Source-Grounding & Privacy](#12-source-grounding--privacy)

---

## 1. Getting Started

### Creating an Account & Logging In
1. Open the **AI Study4All** app on your iOS or Android device.
2. On the **Login** screen, enter your registered email and password, or tap **Register** to create a new account.
3. If you forget your password, tap **Forgot Password** on the Login screen to receive a password reset link.

### Running Locally (For Developers / Testers)
If you are running the app from source:
1. Start the backend server:
   ```bash
   cd server
   npm install
   npm run dev
   ```
2. Start the Expo mobile app from the project root:
   ```bash
   npm install
   npm run start
   ```
3. Scan the QR code with **Expo Go** (or run `npm run android` / `npm run ios`).

---

## 2. Navigation Overview

The app uses a bottom tab bar for core areas, with quick access to specialized learning tools:

- **Home**: Your daily overview, quick actions, and personalized study recommendations.
- **Tutor**: Chat with the AI Learning Assistant for explanations grounded in your materials.
- **Plan**: View your personalized study schedule and use **AI Study Rescue** before exams.
- **Progress**: Track your quiz history, topic mastery, and learning analytics.
- **Whiteboard**: Collaborate in real time with peers using a shared whiteboard, chat, and notes.
- **Profile**: Manage your account, AI Learning Profile, and notification preferences.

---

## 3. Managing Subjects & Study Materials

AI Study4All teaches and quizzes you **only** from the materials you provide.

### Adding Subjects & Topics
- From **Home** or **Materials**, create subjects (e.g., *Biology*, *Data Structures*) and organize them into topics.

### Snap / Upload-to-Learn
1. Open the **Materials** screen.
2. Select a subject/topic and choose to **Upload** a document or **Snap** a photo of your notes/textbook.
3. The **Material Agent** extracts, summarizes, and structures your content so it is ready for tutoring, quizzes, and audio lessons.

> **Note:** If you ask about a topic that isn't covered in your uploaded materials, the app will let you know and prompt you to upload relevant material.

---

## 4. AI Learning Assistant (Tutor)

1. Tap the **Tutor** tab.
2. Select the subject or material you want to study.
3. Ask questions about difficult concepts, request step-by-step explanations, or ask for summaries.
4. All explanations are grounded in your uploaded materials and traceable to your material sources.

---

## 5. Adaptive AI Quiz & Mistake Review

1. Open **Quiz** from Home or a topic's study options.
2. Choose your subject/topic and start a quiz.
3. **Adaptive Difficulty**: Question difficulty adjusts dynamically based on your performance.
4. **“Why Did I Get This Wrong?”**: When you answer a question incorrectly, tap this option to get a material-grounded explanation of the mistake and the correct concept.

---

## 6. Audio Learning

1. Open **Learn** from a topic or material.
2. Generate an audio lesson from your structured study material.
3. Listen to the text-to-speech playback while reviewing the synchronized transcript—ideal for studying on the go.

---

## 7. Study Plan & AI Study Rescue

1. Tap the **Plan** tab.
2. View your **Personalized Study Recommendations** based on your weak topics and recent quiz performance.
3. **AI Study Rescue**: Have an upcoming exam? Enter your exam date and target subjects to generate a focused, short-term study plan prioritizing high-impact topics.

---

## 8. Learning Progress Dashboard

1. Tap the **Progress** tab.
2. Review your:
   - Overall mastery across subjects and topics
   - Quiz history and score trends
   - Identified strengths and weaknesses

---

## 9. Collaborative Whiteboard & Study Groups

### AI Study Group Match
1. Open **Study Features** and select **Study Group Match**.
2. Set your subjects, weak topics, study preferences, and availability.
3. Get matched with compatible study partners or groups.

### Live Sync Collaborative Whiteboard
1. Tap the **Whiteboard** tab.
2. Draw, diagram, and brainstorm together in real time.
3. Use the built-in **Group Chat**, **Shared Notes**, and **Grounded AI Assistance** to solve problems collaboratively.

---

## 10. AI Learning Quest

- Access **AI Learning Quest** from **Study Features** to complete gamified learning activities and challenges based on your study materials.

---

## 11. Profile, Learning Profile & Notifications

- **AI Learning Profile** (**Profile** tab): View how the system models your learning patterns, strengths, and areas for improvement.
- **Notifications**: Open **Notifications** to view study reminders, exam countdown alerts, and group activity updates.

---

## 12. Source-Grounding & Privacy

- **Source-Grounded Learning**: Every AI explanation, quiz, audio lesson, and study recommendation is strictly grounded in your uploaded materials. The AI will not invent facts outside your provided content.
- **Data & Privacy**: Your authentication, study materials, and learning data are securely managed on the backend.
