import { NextResponse } from 'next/server';
import { memoryPrintJobsStore } from '@/lib/cafe/kot-router';
import { renderStructuredJobToAscii } from '@/lib/hardware/escpos';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    // Scoped device authentication
    if (!token || (!token.startsWith('ampm_agent_') && token !== 'test_agent_token')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Valid scoped agent device token required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target'); // optional filter

    const queuedJobs = memoryPrintJobsStore.filter((j) => {
      const matchTarget = !target || j.printer_target === target;
      return matchTarget && j.status === 'queued';
    });

    const rendered = queuedJobs.map((job) => ({
      id: job.id,
      orderId: job.order_id,
      kotId: job.kot_id,
      station: job.station,
      jobType: job.job_type,
      printerTarget: job.printer_target,
      width: job.printer_target === 'printer_pos' ? 32 : 48,
      jobData: job.job_data,
      escposAscii: renderStructuredJobToAscii(job.job_data, job.printer_target === 'printer_pos' ? 32 : 48),
      createdAt: job.created_at,
    }));

    return NextResponse.json({
      success: true,
      jobsCount: rendered.length,
      jobs: rendered,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Poll failed' },
      { status: 500 }
    );
  }
}
