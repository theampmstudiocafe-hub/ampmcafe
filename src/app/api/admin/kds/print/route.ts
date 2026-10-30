import { NextResponse } from 'next/server';
import { memoryPrintJobsStore } from '@/lib/cafe/kot-router';
import { renderStructuredJobToAscii } from '@/lib/hardware/escpos';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target'); // 'printer_food', 'printer_bev', 'printer_dessert', 'printer_pos', or 'all'

    const jobs = memoryPrintJobsStore.filter((job) => {
      const matchTarget = !target || target === 'all' || job.printer_target === target;
      return matchTarget && job.status === 'queued';
    });

    const rendered = jobs.map((job) => ({
      ...job,
      escposAscii: renderStructuredJobToAscii(job.job_data, job.printer_target === 'printer_pos' ? 32 : 48),
    }));

    return NextResponse.json({
      success: true,
      jobs: rendered,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Print queue error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobId, status, errorMessage } = body;

    const job = memoryPrintJobsStore.find((j) => j.id === jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: `Print job ${jobId} not found` },
        { status: 404 }
      );
    }

    if (status === 'printed') {
      job.status = 'printed';
      job.printed_at = new Date().toISOString();
    } else if (status === 'failed') {
      job.status = 'failed';
      job.retry_count = (job.retry_count || 0) + 1;
      job.error_message = errorMessage || 'Printer communication failed';
    } else if (status === 'retry') {
      job.status = 'queued';
      job.retry_count = (job.retry_count || 0) + 1;
      job.error_message = null;
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        retryCount: job.retry_count,
        errorMessage: job.error_message,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Print update error' },
      { status: 500 }
    );
  }
}
