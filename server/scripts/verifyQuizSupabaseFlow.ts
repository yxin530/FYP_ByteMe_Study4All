import { env } from '../src/config/env.js';

interface CheckItem {
  name: string;
  passed: boolean;
  details?: unknown;
}

async function verifySupabaseQuizFlow() {
  console.log('=== Supabase Phase 5 Database & Quiz Flow Verification ===\n');

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    console.error('❌ Supabase URL or Anon Key is missing from configuration.');
    process.exit(1);
  }

  const results: CheckItem[] = [];

  const headers = {
    apikey: env.supabaseAnonKey,
    authorization: `Bearer ${env.supabaseAnonKey}`,
    'content-type': 'application/json',
  };

  // 1. Table existence & queryability checks
  const tables = ['quiz_sessions', 'quiz_questions', 'quiz_answers', 'learning_profiles', 'materials'];
  for (const table of tables) {
    try {
      const res = await fetch(`${env.supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}?limit=0`, {
        headers: { ...headers, prefer: 'count=exact' },
      });
      const range = res.headers.get('content-range');
      const passed = res.status === 200;
      results.push({
        name: `Table "${table}" exists and returns 200 OK via PostgREST (range: ${range})`,
        passed,
        details: { status: res.status, range },
      });
      console.log(`${passed ? '✅' : '❌'} Table "${table}" reachable (status: ${res.status}, range: ${range})`);
    } catch (err: any) {
      results.push({ name: `Table "${table}" existence check`, passed: false, details: err.message });
      console.log(`❌ Table "${table}" error: ${err.message}`);
    }
  }

  // 2. RLS policy verification: Unauthenticated write to quiz_sessions must be blocked with 401 code 42501
  try {
    const res = await fetch(`${env.supabaseUrl.replace(/\/$/, '')}/rest/v1/quiz_sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: '00000000-0000-0000-0000-000000000000',
        subject: 'Mathematics',
        topic: 'Verification Topic',
        difficulty: 'medium',
        question_count: 5,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as any;
    const isRlsProtected = res.status === 401 && body?.code === '42501';
    results.push({
      name: 'Row-Level Security (RLS) is active on quiz_sessions (blocks unauthenticated writes with 42501)',
      passed: isRlsProtected,
      details: { status: res.status, code: body?.code, message: body?.message },
    });
    console.log(
      `${isRlsProtected ? '✅' : '❌'} RLS protection on quiz_sessions active (HTTP ${res.status}, PG Code: ${body?.code})`,
    );
  } catch (err: any) {
    results.push({ name: 'RLS check on quiz_sessions', passed: false, details: err.message });
    console.log(`❌ RLS check error: ${err.message}`);
  }

  // 3. RLS policy verification: Unauthenticated write to quiz_questions must be blocked
  try {
    const res = await fetch(`${env.supabaseUrl.replace(/\/$/, '')}/rest/v1/quiz_questions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        quiz_id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        question_text: 'Sample question?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        difficulty: 'medium',
        material_id: 'sample-mat',
        material_version_hash: 'sample-hash',
      }),
    });
    const body = (await res.json().catch(() => ({}))) as any;
    const isRlsProtected = res.status === 401 && body?.code === '42501';
    results.push({
      name: 'Row-Level Security (RLS) is active on quiz_questions (blocks unauthenticated writes with 42501)',
      passed: isRlsProtected,
      details: { status: res.status, code: body?.code, message: body?.message },
    });
    console.log(
      `${isRlsProtected ? '✅' : '❌'} RLS protection on quiz_questions active (HTTP ${res.status}, PG Code: ${body?.code})`,
    );
  } catch (err: any) {
    results.push({ name: 'RLS check on quiz_questions', passed: false, details: err.message });
    console.log(`❌ RLS check error: ${err.message}`);
  }

  // 4. RLS policy verification: Unauthenticated write to quiz_answers must be blocked
  try {
    const res = await fetch(`${env.supabaseUrl.replace(/\/$/, '')}/rest/v1/quiz_answers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        quiz_id: '00000000-0000-0000-0000-000000000000',
        question_id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        answer: 'A',
        is_correct: true,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as any;
    const isRlsProtected = res.status === 401 && body?.code === '42501';
    results.push({
      name: 'Row-Level Security (RLS) is active on quiz_answers (blocks unauthenticated writes with 42501)',
      passed: isRlsProtected,
      details: { status: res.status, code: body?.code, message: body?.message },
    });
    console.log(
      `${isRlsProtected ? '✅' : '❌'} RLS protection on quiz_answers active (HTTP ${res.status}, PG Code: ${body?.code})`,
    );
  } catch (err: any) {
    results.push({ name: 'RLS check on quiz_answers', passed: false, details: err.message });
    console.log(`❌ RLS check error: ${err.message}`);
  }

  // 5. RLS policy verification: Unauthenticated write to learning_profiles must be blocked
  try {
    const res = await fetch(`${env.supabaseUrl.replace(/\/$/, '')}/rest/v1/learning_profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: '00000000-0000-0000-0000-000000000000',
        strengths: [],
        weak_topics: [],
        progress: [],
      }),
    });
    const body = (await res.json().catch(() => ({}))) as any;
    const isRlsProtected = res.status === 401 && body?.code === '42501';
    results.push({
      name: 'Row-Level Security (RLS) is active on learning_profiles (blocks unauthenticated writes with 42501)',
      passed: isRlsProtected,
      details: { status: res.status, code: body?.code, message: body?.message },
    });
    console.log(
      `${isRlsProtected ? '✅' : '❌'} RLS protection on learning_profiles active (HTTP ${res.status}, PG Code: ${body?.code})`,
    );
  } catch (err: any) {
    results.push({ name: 'RLS check on learning_profiles', passed: false, details: err.message });
    console.log(`❌ RLS check error: ${err.message}`);
  }

  // 6. Auth endpoint probe
  try {
    const res = await fetch(`${env.supabaseUrl.replace(/\/$/, '')}/auth/v1/signup`, {
      method: 'POST',
      headers: { apikey: env.supabaseAnonKey, 'content-type': 'application/json' },
      body: JSON.stringify({ email: `verify_${Date.now()}@test.internal`, password: 'VerificationPassword123!' }),
    });
    const body = (await res.json().catch(() => ({}))) as any;
    const isExpectedAuthStatus = res.status === 200 || res.status === 201 || (res.status === 429 && body?.error_code === 'over_email_send_rate_limit');
    results.push({
      name: `Supabase Auth signup boundary reached (status: ${res.status}${body?.error_code ? ', code: ' + body.error_code : ''})`,
      passed: isExpectedAuthStatus,
      details: { status: res.status, code: body?.error_code },
    });
    console.log(
      `${isExpectedAuthStatus ? '✅' : '❌'} Supabase Auth responsive (status: ${res.status}, info: ${body?.error_code || 'created'})`,
    );
  } catch (err: any) {
    results.push({ name: 'Supabase Auth probe', passed: false, details: err.message });
    console.log(`❌ Auth probe error: ${err.message}`);
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log(`\nVerification Summary: ${passedCount}/${results.length} checks passed.\n`);

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

verifySupabaseQuizFlow().catch((err) => {
  console.error('Verification failed unexpectedly:', err);
  process.exit(1);
});

