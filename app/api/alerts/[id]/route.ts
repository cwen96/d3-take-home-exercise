import {NextResponse} from 'next/server';
import {alertRepo} from '@/lib/db';
import {isStatus} from '@/lib/types';

// PATCH /api/alerts/{id} -> change an alert's status in the mock DB.
export async function PATCH(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const body = await parseJsonBody(request);

  if (!body.ok) {
    return NextResponse.json({error: body.error}, {status: 400});
  }

  const {status} = body.data;
  if (!isStatus(status)) {
    return NextResponse.json(
      {error: "Invalid or missing 'status'."},
      {status: 400}
    );
  }

  const updated = alertRepo.updateStatus(id, status);
  if (!updated) {
    return NextResponse.json(
      {error: `Alert '${id}' not found.`},
      {status: 404}
    );
  }

  return NextResponse.json({alert: updated});
}

async function parseJsonBody(request: Request): Promise<{ok: true; data: {status?: unknown}} | {ok: false; error: string}> {
  try {
    const data = (await request.json()) as {status?: unknown};
    return {ok: true, data};
  } catch {
    return {ok: false, error: 'Request body is not valid JSON.'};
  }
}
