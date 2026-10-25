import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const LAYOUT_FILE_PATH = path.join(
  process.cwd(),
  'src',
  'config',
  'academy-layout.json'
);

const DEFAULT_LAYOUT_CONFIG = {
  version: 1,
  updatedAt: null as string | null,
  tailwindClasses: {} as Record<string, string>,
  containers: {} as Record<string, unknown>,
};

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export async function GET() {
  if (isProduction()) {
    return NextResponse.json(
      { error: 'Visual Dev Mode API is restricted to development.' },
      { status: 403 }
    );
  }

  try {
    const raw = await fs.readFile(LAYOUT_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(DEFAULT_LAYOUT_CONFIG);
  }
}

export async function POST(req: NextRequest) {
  if (isProduction()) {
    return NextResponse.json(
      { error: 'Visual Dev Mode API is restricted to development.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      tailwindClasses: body?.tailwindClasses ?? {},
      containers: body?.containers ?? {},
    };

    await fs.mkdir(path.dirname(LAYOUT_FILE_PATH), { recursive: true });
    await fs.writeFile(
      LAYOUT_FILE_PATH,
      JSON.stringify(payload, null, 2) + '\n',
      'utf-8'
    );

    return NextResponse.json({
      ok: true,
      savedTo: 'src/config/academy-layout.json',
      data: payload,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Failed to persist dev layout config',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  if (isProduction()) {
    return NextResponse.json(
      { error: 'Visual Dev Mode API is restricted to development.' },
      { status: 403 }
    );
  }

  try {
    await fs.mkdir(path.dirname(LAYOUT_FILE_PATH), { recursive: true });
    await fs.writeFile(
      LAYOUT_FILE_PATH,
      JSON.stringify(DEFAULT_LAYOUT_CONFIG, null, 2) + '\n',
      'utf-8'
    );

    return NextResponse.json({
      ok: true,
      reset: true,
      data: DEFAULT_LAYOUT_CONFIG,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Failed to reset dev layout config',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
