import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_EMAILS = ['gigimento@gmail.com'];

const CONFIG_KEYS = [
  'openai_api_key',
  'anthropic_api_key',
  'perplexity_api_key',
] as const;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ALLOWED_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from('service_config')
    .select('key, value')
    .in('key', CONFIG_KEYS as any);

  const result: Record<string, string> = {};
  for (const key of CONFIG_KEYS) {
    const row = rows?.find((r: any) => r.key === key);
    result[key] = row?.value ?? '';
  }

  return NextResponse.json(result);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ALLOWED_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const admin = createAdminClient();

  for (const key of CONFIG_KEYS) {
    if (body[key] !== undefined) {
      const { error } = await admin
        .from('service_config')
        .upsert({ key, value: body[key], description: `${key} for AI Citation Audit` }, { onConflict: 'key' });
      if (error) {
        console.error(`Failed to update ${key}:`, error);
      }
    }
  }

  return NextResponse.json({ success: true });
}

export async function getConfigKeys(): Promise<Record<string, string>> {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from('service_config')
    .select('key, value')
    .in('key', CONFIG_KEYS as any);

  const result: Record<string, string> = {};
  for (const key of CONFIG_KEYS) {
    const row = rows?.find((r: any) => r.key === key);
    result[key] = row?.value ?? '';
  }
  return result;
}
