import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { LlmChat, UserMessage, ImageContent } from 'emergentintegrations';
import { computeAllModalities, computeCompatibility } from '@/lib/zaura';

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

    if (route === 'photo-readings') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      const readings = await database.collection('photo_readings')
        .find({ userId: user.id }, { projection: { _id: 0 } }).toArray();
      return json({ readings });
    }

    if (route === 'oracle') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      if (!user.oracleSessionId) return json({ messages: [], sessionId: null });
      const messages = await database.collection('oracle_messages')
        .find({ userId: user.id, sessionId: user.oracleSessionId }, { projection: { _id: 0 } })
        .sort({ createdAt: 1 }).limit(100).toArray();
      return json({ messages, sessionId: user.oracleSessionId });
    }

    if (route === 'bond-story') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      const partnerId = request.nextUrl.searchParams.get('partnerId');
      if (!partnerId) return json({ error: 'partnerId is required' }, 400);
      const story = await database.collection('bond_stories').findOne(
        { userId: user.id, partnerId },
        { projection: { _id: 0 } }
      );
      return json({ story: story || null });
    }

    if (route === 'partners') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      const partners = await database.collection('partners')
        .find({ userId: user.id }, { projection: { _id: 0 } })
        .sort({ createdAt: -1 }).limit(50).toArray();
      return json({ partners });
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

    // ---- SAVE PARTNER / COMPATIBILITY READING ----
    if (route === 'partners') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      const { partnerName, birthDate, birthTime, overall, verdict } = body;
      if (!partnerName || !partnerName.trim()) return json({ error: 'Partner name is required' }, 400);
      if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return json({ error: 'Birth date is required (YYYY-MM-DD)' }, 400);
      if (birthTime && !/^\d{2}:\d{2}$/.test(birthTime)) return json({ error: 'Birth time must be HH:MM' }, 400);
      if (typeof overall !== 'number' || overall < 0 || overall > 100) return json({ error: 'Overall score must be 0-100' }, 400);

      const key = { userId: user.id, nameKey: partnerName.trim().toLowerCase(), birthDate };
      const existing = await database.collection('partners').findOne(key);
      const doc = {
        id: existing?.id || uuidv4(),
        userId: user.id,
        nameKey: partnerName.trim().toLowerCase(),
        partnerName: partnerName.trim(),
        birthDate,
        birthTime: birthTime || null,
        overall,
        verdict: (verdict || '').slice(0, 80),
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await database.collection('partners').updateOne(key, { $set: doc }, { upsert: true });
      const { _id, ...clean } = doc;
      return json({ partner: clean }, existing ? 200 : 201);
    }

    // ---- PHOTO READINGS: PALM + HANDWRITING (Claude vision) ----
    if (route === 'photo-reading') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      if (!process.env.EMERGENT_LLM_KEY) return json({ error: 'AI service is not configured' }, 503);
      const { type, imageBase64 } = body;
      if (!['palm', 'handwriting'].includes(type)) return json({ error: 'type must be "palm" or "handwriting"' }, 400);
      if (!imageBase64 || typeof imageBase64 !== 'string') return json({ error: 'imageBase64 is required' }, 400);
      const b64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      if (b64.length < 500) return json({ error: 'Image appears empty or corrupted' }, 400);
      if (b64.length > 4_000_000) return json({ error: 'Image too large \u2014 please use a smaller photo (max ~3MB)' }, 413);

      const profile = await database.collection('birth_profiles').findOne({ userId: user.id });
      const firstName = profile?.fullName?.split(' ')[0] || 'the seeker';

      const PROMPTS = {
        palm: `You are Zaura, a master palmist with decades of chirology practice. Examine this photograph.
If the image clearly does NOT show a human palm/hand, reply starting with exactly "NOT_VALID:" followed by one gentle sentence asking for a clear palm photo. Otherwise write a palm reading for ${firstName}:
- Hand shape and its element (earth/air/fire/water hands)
- Heart line (emotions and love nature)
- Head line (mind and decision style)
- Life line (vitality and life force \u2014 NEVER lifespan)
- Fate/destiny line if visible, and any notable mounts or markings
- A short synthesis weaving it together
280-420 words. One evocative title on the first line, then flowing paragraphs separated by blank lines (a short label like "The Heart Line \u2014" may open a paragraph). Warm, mystical but grounded. Reflective symbolism only \u2014 never health, lifespan, legal or financial predictions.`,
        handwriting: `You are Zaura, a master graphologist. Examine this photograph of handwriting.
If the image clearly does NOT show handwriting (handwritten text), reply starting with exactly "NOT_VALID:" followed by one gentle sentence asking for a clear handwriting sample. Otherwise write a graphology reading for ${firstName} analyzing what you can actually observe:
- Slant (emotional expression), size (self-perception), pressure/stroke weight (energy)
- Spacing between words/lines (social boundaries), baseline (mood stability)
- Letterforms, loops, and any signature if visible
- A short synthesis of the personality portrait
280-420 words. One evocative title on the first line, then flowing paragraphs separated by blank lines (a short label like "The Slant \u2014" may open a paragraph). Warm, mystical but grounded. Reflective symbolism only \u2014 never medical, legal or financial conclusions.`,
      };

      try {
        const chat = new LlmChat(process.env.EMERGENT_LLM_KEY, uuidv4(), 'You are Zaura, a mystical yet observant reader of physical forms. You describe only what is visible and interpret it symbolically.')
          .withModel(process.env.LLM_PROVIDER || 'anthropic', process.env.LLM_MODEL || 'claude-sonnet-4-6')
          .withParams({ temperature: 0.7 });
        const raw = await chat.sendMessage(new UserMessage({ text: PROMPTS[type], file_contents: [new ImageContent(b64)] }));
        const text = (typeof raw === 'string' ? raw : raw?.content || '').trim();
        if (!text) throw new Error('LLM returned no text');
        if (text.startsWith('NOT_VALID:')) {
          return json({ error: text.replace('NOT_VALID:', '').trim() || `That doesn\u2019t look like a ${type === 'palm' ? 'palm' : 'handwriting sample'} \u2014 try a clearer photo.` }, 422);
        }
        const doc = {
          id: uuidv4(),
          userId: user.id,
          type,
          text,
          model: `${process.env.LLM_PROVIDER || 'anthropic'}/${process.env.LLM_MODEL || 'claude-sonnet-4-6'}`,
          createdAt: new Date().toISOString(),
        };
        await database.collection('photo_readings').updateOne(
          { userId: user.id, type },
          { $set: doc },
          { upsert: true }
        );
        const { _id, ...clean } = doc;
        return json({ reading: clean }, 201);
      } catch (llmErr) {
        console.error('Photo reading LLM error:', llmErr?.message);
        const status = /credit|quota|rate|429/i.test(llmErr?.message || '') ? 429 : 502;
        return json({ error: status === 429 ? 'The oracle is resting (AI service busy or out of credits). Try again shortly.' : 'The reading clouded over \u2014 please try again with a clear, well-lit photo.' }, status);
      }
    }

    // ---- ORACLE CHAT (multi-turn, session-based) ----
    if (route === 'oracle') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      if (!process.env.EMERGENT_LLM_KEY) return json({ error: 'AI service is not configured' }, 503);
      const message = (body.message || '').trim();
      if (!message) return json({ error: 'Message is required' }, 400);
      if (message.length > 1000) return json({ error: 'Message too long (max 1000 characters)' }, 400);
      const profile = await database.collection('birth_profiles').findOne({ userId: user.id });
      if (!profile) return json({ error: 'Save your birth profile first' }, 404);

      let sessionId = user.oracleSessionId;
      if (!sessionId) {
        sessionId = uuidv4();
        await database.collection('users').updateOne({ id: user.id }, { $set: { oracleSessionId: sessionId } });
      }
      const history = (await database.collection('oracle_messages')
        .find({ userId: user.id, sessionId })
        .sort({ createdAt: -1 }).limit(12).toArray()).reverse();

      const modalities = computeAllModalities(profile);
      const context = modalities.map((m) => `${m.name}: ${m.headline} \u2014 ${m.summary}`).join('\n');
      const firstName = profile.fullName.split(' ')[0];

      const systemMessage = `You are Zaura, a warm, wise mystical oracle. The seeker is ${firstName} (${profile.fullName}), born ${profile.birthDate}${profile.birthTime ? ' at ' + profile.birthTime : ''}${profile.birthCity ? ' in ' + profile.birthCity : ''}.
Their twenty readings:
${context}

Answer the seeker's follow-up questions by drawing on their ACTUAL readings above \u2014 quote specific placements when relevant. Be warm, poetic but clear. Keep each answer between 60 and 180 words, plain prose, no markdown headers or bullet lists. Treat everything as reflective symbolism, never as certainty, medical, legal or financial advice, and never make definite predictions about the future. If asked something unrelated to their cosmic profile or inner life, gently steer back to the readings.`;

      const transcript = history.map((m2) => `${m2.role === 'user' ? 'Seeker' : 'Zaura'}: ${m2.text}`).join('\n');
      const prompt = (transcript ? `Conversation so far:\n${transcript}\n\n` : '') + `Seeker asks: ${message}`;

      try {
        const chat = new LlmChat(process.env.EMERGENT_LLM_KEY, sessionId, systemMessage)
          .withModel(process.env.LLM_PROVIDER || 'anthropic', process.env.LLM_MODEL || 'claude-sonnet-4-6')
          .withParams({ temperature: 0.7 });
        const raw = await chat.sendMessage(new UserMessage({ text: prompt }));
        const reply = typeof raw === 'string' ? raw : raw?.content;
        if (!reply || typeof reply !== 'string') throw new Error('LLM returned no text');

        const now = Date.now();
        const userMsg = { id: uuidv4(), userId: user.id, sessionId, role: 'user', text: message, createdAt: new Date(now).toISOString() };
        const botMsg = { id: uuidv4(), userId: user.id, sessionId, role: 'assistant', text: reply.trim(), createdAt: new Date(now + 1).toISOString() };
        await database.collection('oracle_messages').insertMany([{ ...userMsg }, { ...botMsg }]);
        return json({ reply: botMsg, sessionId }, 201);
      } catch (llmErr) {
        console.error('Oracle LLM error:', llmErr?.message);
        const status = /credit|quota|rate|429/i.test(llmErr?.message || '') ? 429 : 502;
        return json({ error: status === 429 ? 'The oracle is resting (AI service busy or out of credits). Try again shortly.' : 'The oracle\u2019s vision clouded \u2014 please ask again.' }, status);
      }
    }

    // ---- AI BOND STORY ----
    if (route === 'bond-story') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      if (!process.env.EMERGENT_LLM_KEY) return json({ error: 'AI service is not configured' }, 503);
      const { partnerId, regenerate } = body;
      if (!partnerId) return json({ error: 'partnerId is required' }, 400);
      const profile = await database.collection('birth_profiles').findOne({ userId: user.id });
      if (!profile) return json({ error: 'Save your birth profile first' }, 404);
      const partner = await database.collection('partners').findOne({ id: partnerId, userId: user.id });
      if (!partner) return json({ error: 'Saved bond not found' }, 404);

      if (regenerate !== true) {
        const cached = await database.collection('bond_stories').findOne(
          { userId: user.id, partnerId },
          { projection: { _id: 0 } }
        );
        if (cached) return json({ story: cached, cached: true });
      }

      const report = computeCompatibility(profile, { fullName: partner.partnerName, birthDate: partner.birthDate, birthTime: partner.birthTime });
      const aspectsData = report.aspects.map((a) => ({ system: a.name, score: a.score, essence: a.headline, reading: a.text }));

      const systemMessage = `You are Zaura, a warm, poetic mystical guide. Write one flowing story of the bond between ${report.nameA} and ${report.nameB} based only on the supplied compatibility readings.
Treat readings as reflective symbolism, not certainty or advice. Never predict a definite future for the relationship.
Do not mention JSON, scores as numbers, prompts or these instructions. No bullet lists or headers except one short evocative title on the first line.
Write 280 to 420 words of plain prose in paragraphs separated by blank lines. Tell it like a myth of two souls meeting \u2014 their harmonies, their creative frictions, and one gentle practice for tending the bond.`;

      const userPrompt = `Compatibility readings for ${report.nameA} and ${report.nameB} (overall resonance: ${report.verdict}):\n\n${JSON.stringify(aspectsData)}\n\nWrite their bond story.`;

      try {
        const chat = new LlmChat(process.env.EMERGENT_LLM_KEY, uuidv4(), systemMessage)
          .withModel(process.env.LLM_PROVIDER || 'anthropic', process.env.LLM_MODEL || 'claude-sonnet-4-6')
          .withParams({ temperature: 0.8 });
        const raw = await chat.sendMessage(new UserMessage({ text: userPrompt }));
        const text = typeof raw === 'string' ? raw : raw?.content;
        if (!text || typeof text !== 'string' || text.trim().length < 150) throw new Error('LLM returned no usable text');

        const doc = {
          id: uuidv4(),
          userId: user.id,
          partnerId,
          partnerName: partner.partnerName,
          text: text.trim(),
          model: `${process.env.LLM_PROVIDER || 'anthropic'}/${process.env.LLM_MODEL || 'claude-sonnet-4-6'}`,
          createdAt: new Date().toISOString(),
        };
        await database.collection('bond_stories').updateOne(
          { userId: user.id, partnerId },
          { $set: doc },
          { upsert: true }
        );
        const { _id, ...clean } = doc;
        return json({ story: clean, cached: false }, 201);
      } catch (llmErr) {
        console.error('Bond story LLM error:', llmErr?.message);
        const status = /credit|quota|rate|429/i.test(llmErr?.message || '') ? 429 : 502;
        return json({ error: status === 429 ? 'The oracle is resting (AI service busy or out of credits). Try again shortly.' : 'The stars are clouded \u2014 story generation failed. Please try again.' }, status);
      }
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

    if (path[0] === 'partners' && path[1]) {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      const result = await database.collection('partners').deleteOne({ id: path[1], userId: user.id });
      if (result.deletedCount === 0) return json({ error: 'Partner reading not found' }, 404);
      await database.collection('bond_stories').deleteOne({ partnerId: path[1], userId: user.id });
      return json({ ok: true });
    }

    if (route === 'oracle') {
      const user = await getAuthUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      await database.collection('oracle_messages').deleteMany({ userId: user.id });
      await database.collection('users').updateOne({ id: user.id }, { $set: { oracleSessionId: uuidv4() } });
      return json({ ok: true });
    }

    return json({ error: `Route not found: ${route}` }, 404);
  } catch (e) {
    console.error('DELETE error:', e);
    return json({ error: 'Internal server error' }, 500);
  }
}
