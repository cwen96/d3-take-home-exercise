import {NextResponse} from 'next/server';
import {alertRepo} from '@/lib/db';
import {parseAlerts} from '@/lib/types';

// GET /api/alerts -> current alerts in the mock DB.
export async function GET() {
  return NextResponse.json({alerts: alertRepo.getAll()});
}

// POST /api/alerts -> bulk ingest a validated Alert[] (replaces the set).
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {error: 'Request body is not valid JSON.'},
      {status: 400}
    );
  }

  const result = parseAlerts(body);
  if (!result.ok) {
    return NextResponse.json({error: result.error}, {status: 400});
  }

  alertRepo.replaceAll(result.alerts);
  return NextResponse.json({count: result.alerts.length}, {status: 201});
}
