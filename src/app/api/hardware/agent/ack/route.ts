import { NextResponse } from 'next/server';
import { memoryPrintJobsStore } from '@/lib/cafe/kot-router';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (!token || (!token.startsWith('ampm_agent_') && token !== 'test_agent_token')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Valid scoped agent device token required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { jobId, status, errorMessage } = body;

    const job = memoryPrintJobsStore.find((j) => j.id === jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: `Print job not found: ${jobId}` },
        { status: 404 }
      );
    }

    if (status === 'printed') {
      job.status = 'printed';
      job.printed_at = new Date().toISOString();
      job.error_message = null;
    } else if (status === 'failed') {
      job.status = 'failed';
      job.retry_count = (job.retry_count || 0) + 1;
      job.error_message = errorMessage || 'Hardware dispatch timeout';
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: job.status,
      retryCount: job.retry_count,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Ack failed' },
      { status: 500 }
    );
  }
}
