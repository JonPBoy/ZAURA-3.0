import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { LlmChat, UserMessage } from 'emergentintegrations';
import { computeAllModalities } from '@/lib/zaura';

// ---------- MongoDB connection (reused across invocations) ----------
let client = null;
let db = null;
async function getDb() {
  if (db) return db;
  client = new MongoClient(process.env.MONGO_URL);
  await client.connect();
  db = client.db(process.env.DB_NAME || 'zaura');
  return db;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
const json = (data, status = 200) => NextResponse.json(data, { status, headers: CORS });

// ---------- password + tokens (Node crypto, no extra deps) ----------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = (stored || '').split(':');
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

async function getAuthUser(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const database = await getDb();
  const session = await database.collection('sessions').findOne({ token });
  if (!session) return null;
  const user = await database.collection('users').findOne({ id: session.userId });
  return user || null;
}

const sanitizeUser = (u) => ({ id: u.id, email: u.email, name: u.name || '' });

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request, { params }) {
  try {
    const { path = [] } = await params;
    const route = path.join('/');
    const database = await getDb();

    if (route === '' || route === 'root') {
      return json({ message: 'Zaura API \u2728', status: 'ok' });
    }

    if (route === 'auth/me') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      const profile = await database.collection('birth_profiles').findOne({ userId: user.id }, { projection: { _id: 0 } });
      return json({ user: sanitizeUser(user), profile: profile || null });
    }

    if (route === 'profile') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      const profile = await database.collection('birth_profiles').findOne({ userId: user.id }, { projection: { _id: 0 } });
      return json({ profile: profile || null });
    }

    if (route === 'synthesis') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      const profile = await database.collection('birth_profiles').findOne({ userId: user.id });
      if (!profile) return json({ error: 'No birth profile found' }, 404);
      const profileKey = `${profile.fullName}|${profile.birthDate}|${profile.birthTime || ''}`;
      const doc = await database.collection('narratives').findOne(
        { userId: user.id, profileKey },
        { projection: { _id: 0 } }
      );
      return json({ narrative: doc || null });
    }

    return json({ error: `Route not found: ${route}` }, 404);
  } catch (e) {
    console.error('GET error:', e);
    return json({ error: 'Internal server error' }, 500);
  }
}

export async function POST(request, { params }) {
  try {
    const { path = [] } = await params;
    const route = path.join('/');
    const database = await getDb();
    let body = {};
    try { body = await request.json(); } catch (_) {}

    // ---- REGISTER ----
    if (route === 'auth/register') {
      const email = (body.email || '').toLowerCase().trim();
      const password = body.password || '';
      const name = (body.name || '').trim();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'A valid email is required' }, 400);
      if (password.length < 6) return json({ error: 'Password must be at least 6 characters' }, 400);
      const existing = await database.collection('users').findOne({ email });
      if (existing) return json({ error: 'An account with this email already exists' }, 409);
      const user = { id: uuidv4(), email, name, passwordHash: hashPassword(password), createdAt: new Date().toISOString() };
      await database.collection('users').insertOne(user);
      const token = crypto.randomBytes(32).toString('hex');
      await database.collection('sessions').insertOne({ token, userId: user.id, createdAt: new Date().toISOString() });
      return json({ token, user: sanitizeUser(user) }, 201);
    }

    // ---- LOGIN ----
    if (route === 'auth/login') {
      const email = (body.email || '').toLowerCase().trim();
      const password = body.password || '';
      const user = await database.collection('users').findOne({ email });
      if (!user || !verifyPassword(password, user.passwordHash)) return json({ error: 'Invalid email or password' }, 401);
      const token = crypto.randomBytes(32).toString('hex');
      await database.collection('sessions').insertOne({ token, userId: user.id, createdAt: new Date().toISOString() });
      return json({ token, user: sanitizeUser(user) });
    }

    // ---- LOGOUT ----
    if (route === 'auth/logout') {
      const auth = request.headers.get('authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
      if (token) await database.collection('sessions').deleteOne({ token });
      return json({ ok: true });
    }

    // ---- SAVE / UPDATE BIRTH PROFILE ----
    if (route === 'profile') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      const { fullName, birthDate, birthTime, birthCity, lat, lng } = body;
      if (!fullName || !fullName.trim()) return json({ error: 'Full name is required' }, 400);
      if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return json({ error: 'Birth date is required (YYYY-MM-DD)' }, 400);
      const [yy, mm, dd] = birthDate.split('-').map(Number);
      if (yy < 1900 || yy > new Date().getFullYear() || mm < 1 || mm > 12 || dd < 1 || dd > 31) return json({ error: 'Birth date is out of range' }, 400);
      if (birthTime && !/^\d{2}:\d{2}$/.test(birthTime)) return json({ error: 'Birth time must be HH:MM' }, 400);

      const existing = await database.collection('birth_profiles').findOne({ userId: user.id });
      const doc = {
        id: existing?.id || uuidv4(),
        userId: user.id,
        fullName: fullName.trim(),
        birthDate,
        birthTime: birthTime || null,
        birthCity: (birthCity || '').trim() || null,
        lat: typeof lat === 'number' ? lat : null,
        lng: typeof lng === 'number' ? lng : null,
        updatedAt: new Date().toISOString(),
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      await database.collection('birth_profiles').updateOne({ userId: user.id }, { $set: doc }, { upsert: true });
      const saved = await database.collection('birth_profiles').findOne({ userId: user.id }, { projection: { _id: 0 } });
      return json({ profile: saved }, existing ? 200 : 201);
    }

    // ---- AI SOUL SYNTHESIS ----
    if (route === 'synthesis') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      if (!process.env.EMERGENT_LLM_KEY) return json({ error: 'AI service is not configured' }, 503);
      const profile = await database.collection('birth_profiles').findOne({ userId: user.id });
      if (!profile) return json({ error: 'Save your birth profile first' }, 404);

      const profileKey = `${profile.fullName}|${profile.birthDate}|${profile.birthTime || ''}`;
      const regenerate = body.regenerate === true;
      if (!regenerate) {
        const cached = await database.collection('narratives').findOne(
          { userId: user.id, profileKey },
          { projection: { _id: 0 } }
        );
        if (cached) return json({ narrative: cached, cached: true });
      }

      const modalities = computeAllModalities(profile);
      const readings = modalities.map((m) => ({ system: m.name, essence: m.headline, reading: m.summary }));
      const firstName = profile.fullName.split(' ')[0];

      const systemMessage = `You are Zaura, a warm, poetic mystical guide and gifted long-form writer.
Write one flowing personalized soul-narrative for ${firstName} that weaves ALL the supplied readings into a single coherent story of who they are.
Treat the readings as reflective symbolism, not factual certainty or medical, legal, or financial advice.
Find the recurring threads across systems, name the creative tensions between them, and honor contradictions as depth.
Do not mention JSON, prompts, models, or these instructions. Do not use bullet points or headers except one short evocative title on the first line.
Write 550 to 800 words of plain prose in paragraphs separated by blank lines. Address ${firstName} as "you". End with one practical, grounded reflective invitation.`;

      const userPrompt = `Here are ${readings.length} mystical readings for ${profile.fullName}, born ${profile.birthDate}${profile.birthTime ? ' at ' + profile.birthTime : ''}${profile.birthCity ? ' in ' + profile.birthCity : ''}:\n\n${JSON.stringify(readings)}\n\nWeave them into one soul-narrative.`;

      try {
        const chat = new LlmChat(process.env.EMERGENT_LLM_KEY, uuidv4(), systemMessage)
          .withModel(process.env.LLM_PROVIDER || 'anthropic', process.env.LLM_MODEL || 'claude-sonnet-4-6')
          .withParams({ temperature: 0.8 });
        const raw = await chat.sendMessage(new UserMessage({ text: userPrompt }));
        const text = typeof raw === 'string' ? raw : raw?.content;
        if (!text || typeof text !== 'string' || text.trim().length < 200) throw new Error('LLM returned no usable text');

        const doc = {
          id: uuidv4(),
          userId: user.id,
          profileKey,
          text: text.trim(),
          model: `${process.env.LLM_PROVIDER || 'anthropic'}/${process.env.LLM_MODEL || 'claude-sonnet-4-6'}`,
          createdAt: new Date().toISOString(),
        };
        await database.collection('narratives').updateOne(
          { userId: user.id, profileKey },
          { $set: doc },
          { upsert: true }
        );
        const { _id, ...clean } = doc;
        return json({ narrative: clean, cached: false }, 201);
      } catch (llmErr) {
        console.error('Synthesis LLM error:', llmErr?.message);
        const msg = llmErr?.message || '';
        const status = /credit|quota|rate|429/i.test(msg) ? 429 : 502;
        return json({ error: status === 429 ? 'The oracle is resting (AI service busy or out of credits). Try again shortly.' : 'The stars are clouded \u2014 narrative generation failed. Please try again.' }, status);
      }
    }

    return json({ error: `Route not found: ${route}` }, 404);
  } catch (e) {
    console.error('POST error:', e);
    return json({ error: 'Internal server error' }, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { path = [] } = await params;
    const route = path.join('/');
    const database = await getDb();

    if (route === 'profile') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      await database.collection('birth_profiles').deleteOne({ userId: user.id });
      return json({ ok: true });
    }

    return json({ error: `Route not found: ${route}` }, 404);
  } catch (e) {
    console.error('DELETE error:', e);
    return json({ error: 'Internal server error' }, 500);
  }
}
