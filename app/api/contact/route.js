import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';

// Force Node.js runtime
export const runtime = 'nodejs';

// Simple sanitizer — same pattern as portfolio (no JSDOM/DOMPurify needed)
function sanitize(input) {
  return String(input ?? '')
    .replace(/<[^>]*>/g, '')    // strip HTML tags
    .replace(/['";<\\]/g, '')   // strip SQL/script special chars
    .trim();
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/contact
 * Saves a contact form submission to the contact_messages Supabase table.
 */
export async function POST(request) {
  // ── 1. Parse body ──────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  // ── 2. Sanitize inputs ─────────────────────────────────────────
  const cleanName    = sanitize(body.name);
  const cleanEmail   = sanitize(body.email).toLowerCase();
  const cleanMessage = sanitize(body.message);

  // ── 3. Validate ────────────────────────────────────────────────
  if (!cleanName || cleanName.length > 100) {
    return NextResponse.json({ error: 'Name is required (max 100 chars).' }, { status: 400 });
  }
  if (!emailRe.test(cleanEmail)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (!cleanMessage || cleanMessage.length < 10) {
    return NextResponse.json({ error: 'Message must be at least 10 characters.' }, { status: 400 });
  }
  if (cleanMessage.length > 1500) {
    return NextResponse.json({ error: 'Message must be 1500 characters or fewer.' }, { status: 400 });
  }

  // ── 4. Rate limit by IP ────────────────────────────────────────
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16);

  const rateCheck = checkRateLimit({ key: `contact:${ipHash}`, max: 10, windowMs: 60_000 });
  if (!rateCheck.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateCheck.resetInMs / 1000)) } }
    );
  }

  // ── 5. Check env vars ──────────────────────────────────────────
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey ||
      supabaseUrl.includes('placeholder') || serviceRoleKey.includes('placeholder')) {
    console.error('[contact] Supabase env vars missing or placeholder.');
    return NextResponse.json(
      { error: 'Database is not configured. Please contact the site owner directly.' },
      { status: 503 }
    );
  }

  // ── 6. Insert into Supabase ────────────────────────────────────
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: dbError } = await supabase.from('contact_messages').insert({
      name:     cleanName,
      email:    cleanEmail,
      message:  cleanMessage,
      ip_hash:  ipHash,
    });

    if (dbError) {
      console.error('[contact] DB error:', dbError.code, dbError.message);
      return NextResponse.json(
        { error: 'Failed to send message. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[contact] Unexpected error:', err?.message ?? err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
