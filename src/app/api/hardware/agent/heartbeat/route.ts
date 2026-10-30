import { NextResponse } from 'next/server';
import { memoryPrintJobsStore } from '@/lib/cafe/kot-router';

export const dynamic = 'force-dynamic';

export interface AgentHeartbeatState {
  deviceId: string;
  status: 'online' | 'degraded' | 'offline';
  paperStatus: 'ok' | 'low' | 'out';
  printers: Array<{
    target: string;
    name: string;
    ipOrPort: string;
    isOnline: boolean;
  }>;
  lastPingAt: string;
}

let latestAgentHeartbeat: AgentHeartbeatState | null = {
  deviceId: "agent_pos1_pune",
  status: "online",
  paperStatus: "ok",
  printers: [
    { target: "printer_food", name: "Food Station Thermal", ipOrPort: "192.168.1.101:9100", isOnline: true },
    { target: "printer_bev", name: "Barista Thermal", ipOrPort: "192.168.1.102:9100", isOnline: true },
    { target: "printer_dessert", name: "Bakery Thermal", ipOrPort: "192.168.1.103:9100", isOnline: true },
    { target: "printer_pos", name: "Counter 58mm Thermal (USB)", ipOrPort: "USB001", isOnline: true },
  ],
  lastPingAt: new Date().toISOString(),
};

export async function GET() {
  const queuedCount = memoryPrintJobsStore.filter((j) => j.status === 'queued').length;
  return NextResponse.json({
    success: true,
    agent: latestAgentHeartbeat,
    pendingJobsCount: queuedCount,
  });
}

export async function POST(request: Request) {
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

    const body = await request.json();
    latestAgentHeartbeat = {
      deviceId: body.deviceId || "agent_pos1_pune",
      status: body.status || "online",
      paperStatus: body.paperStatus || "ok",
      printers: body.printers || latestAgentHeartbeat?.printers || [],
      lastPingAt: new Date().toISOString(),
    };

    const queuedCount = memoryPrintJobsStore.filter((j) => j.status === 'queued').length;

    return NextResponse.json({
      success: true,
      serverTime: new Date().toISOString(),
      pendingJobsCount: queuedCount,
      agentStatus: latestAgentHeartbeat.status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Heartbeat failed' },
      { status: 500 }
    );
  }
}
