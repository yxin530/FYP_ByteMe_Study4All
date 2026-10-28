import { ApiError } from '../errors/apiError.js';
import type { AuthenticatedUser } from '../security/auth.js';
import { env } from '../config/env.js';

type Row = Record<string, any>;

interface QuizSessionRow {
  id: string;
  subject: string;
  topic: string;
  score?: number | null;
  total?: number | null;
  created_at?: string | null;
}

function headers(token: string) {
  return {
    apikey: env.supabaseAnonKey!,
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  };
}

async function db<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new ApiError(503, 'DATABASE_NOT_CONFIGURED', 'Supabase database is not configured.');
  }
  let response: Response;
  try {
    response = await fetch(`${env.supabaseUrl.replace(/\/$/, '')}${path}`, {
      ...init,
      headers: { ...headers(token), ...(init.headers ?? {}) },
    });
  } catch {
    throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'Supabase database service is unavailable.');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(502, 'DATABASE_REQUEST_FAILED', body?.message || 'The learning profile operation failed.', body);
  }
  return body as T;
}

function calculateStreak(sessions: Array<{ created_at?: any }>): number {
  if (!sessions.length) return 0;
  const dates = [
    ...new Set(
      sessions
        .map((s) => (s.created_at ? new Date(s.created_at).toISOString().slice(0, 10) : ''))
        .filter(Boolean),
    ),
  ].sort().reverse();

  if (!dates.length) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // If the most recent active date is not today or yesterday, streak is broken
  if (dates[0] !== today && dates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  let curr = new Date(dates[0]);
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      streak++;
      curr = prev;
    } else if (diffDays === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export async function getLearningProfile(user: AuthenticatedUser, token: string) {
  const sessions = await db<QuizSessionRow[]>(
    `/rest/v1/quiz_sessions?user_id=eq.${encodeURIComponent(user.id)}&status=eq.submitted&select=id,subject,topic,score,total,created_at&order=created_at.desc`,
    token,
  );

  if (!sessions.length) {
    return {
      strengths: [],
      weakTopics: [],
      progress: [],
      recommendations: [],
      evidenceReferences: [],
      recentQuizzes: [],
      subjectMastery: [],
      overallMastery: 0,
      streakDays: 0,
      totalQuizzes: 0,
      status: 'insufficient_activity' as const,
    };
  }

  const topics = new Map<string, { subject: string; attempts: number; score: number; total: number; latest: string; evidence: string[] }>();
  const subjectMap = new Map<string, { score: number; total: number; topics: Set<string>; quizCount: number }>();

  for (const session of sessions) {
    const key = `${session.subject}:${session.topic}`;
    const item = topics.get(key) ?? {
      subject: String(session.subject),
      attempts: 0,
      score: 0,
      total: 0,
      latest: String(session.created_at),
      evidence: [],
    };
    item.attempts += 1;
    item.score += Number(session.score ?? 0);
    item.total += Number(session.total ?? 0);
    item.evidence.push(session.id);
    topics.set(key, item);

    const sub = String(session.subject);
    const subItem = subjectMap.get(sub) ?? { score: 0, total: 0, topics: new Set<string>(), quizCount: 0 };
    subItem.score += Number(session.score ?? 0);
    subItem.total += Number(session.total ?? 0);
    subItem.topics.add(String(session.topic));
    subItem.quizCount += 1;
    subjectMap.set(sub, subItem);
  }

  const progress = [...topics.entries()].map(([topicKey, item]) => ({
    subject: item.subject,
    topic: topicKey.split(':').slice(1).join(':'),
    attempts: item.attempts,
    percentage: item.total ? Math.round((item.score / item.total) * 100) : 0,
    confidence: item.attempts >= 3 ? 'high' : item.attempts >= 2 ? 'medium' : 'low',
    latestActivityAt: item.latest,
  }));

  const strengths = progress.filter((item) => item.percentage >= 80).sort((a, b) => b.percentage - a.percentage).slice(0, 5);
  const weakTopics = progress.filter((item) => item.percentage < 60).sort((a, b) => a.percentage - b.percentage).slice(0, 5);
  const recommendations = weakTopics.map((item) => ({
    topic: item.topic,
    reason: `Recorded quiz performance is ${item.percentage}% across ${item.attempts} attempt${item.attempts === 1 ? '' : 's'}.`,
    action: 'Review the relevant material and take a focused practice quiz.',
  }));

  const subjectMastery = [...subjectMap.entries()].map(([subject, data]) => ({
    subject,
    percentage: data.total ? Math.round((data.score / data.total) * 100) : 0,
    topicsCount: data.topics.size,
    quizzesCount: data.quizCount,
  }));

  const totalPossible = sessions.reduce((acc, s) => acc + Number(s.total ?? 0), 0);
  const totalEarned = sessions.reduce((acc, s) => acc + Number(s.score ?? 0), 0);
  const overallMastery = totalPossible ? Math.round((totalEarned / totalPossible) * 100) : 0;
  const streakDays = calculateStreak(sessions);

  const recentQuizzes = sessions.slice(0, 6).map((session) => ({
    quizId: String(session.id),
    subject: String(session.subject),
    topic: String(session.topic),
    score: Number(session.score ?? 0),
    total: Number(session.total ?? 0),
    percentage: Number(session.total) ? Math.round((Number(session.score) / Number(session.total)) * 100) : 0,
    createdAt: String(session.created_at),
  }));

  const evidenceReferences = sessions.map((session) => ({
    quizId: String(session.id),
    subject: String(session.subject),
    topic: String(session.topic),
    score: Number(session.score ?? 0),
    total: Number(session.total ?? 0),
    percentage: Number(session.total) ? Math.round((Number(session.score) / Number(session.total)) * 100) : 0,
    createdAt: String(session.created_at),
  }));

  const result = {
    strengths,
    weakTopics,
    progress,
    recommendations,
    evidenceReferences,
    recentQuizzes,
    subjectMastery,
    overallMastery,
    streakDays,
    totalQuizzes: sessions.length,
    status: 'complete' as const,
  };

  // Persist aggregated profile to database (merging by user_id)
  await db('/rest/v1/learning_profiles?on_conflict=user_id', token, {
    method: 'POST',
    headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      user_id: user.id,
      strengths,
      weak_topics: weakTopics,
      progress,
      recommendations,
      evidence_references: result.evidenceReferences,
      updated_at: new Date().toISOString(),
    }),
  });

  return result;
}
