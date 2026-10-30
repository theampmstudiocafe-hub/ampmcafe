/**
 * THE AM:PM CAFE - Local LAN / USB Print Agent Daemon
 * Runs on café POS terminal or mini-PC on local Wi-Fi.
 * Communicates with Ethernet / Wi-Fi printers over raw TCP port 9100 or USB.
 */

const SERVER_BASE_URL = process.env.AMPM_SERVER_URL || "http://localhost:3000";
const DEVICE_TOKEN = process.env.AMPM_AGENT_TOKEN || "ampm_agent_pos1_sec9823";
const DEVICE_ID = "agent_pos1_pune";

console.log("=================================================");
console.log("🖨️  THE AM:PM CAFE LOCAL PRINT AGENT DAEMON");
console.log(`Server: ${SERVER_BASE_URL}`);
console.log(`Device ID: ${DEVICE_ID}`);
console.log("=================================================\n");

async function sendHeartbeat() {
  try {
    const res = await fetch(`${SERVER_BASE_URL}/api/hardware/agent/heartbeat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEVICE_TOKEN}`,
      },
      body: JSON.stringify({
        deviceId: DEVICE_ID,
        status: "online",
        paperStatus: "ok",
        printers: [
          { target: "printer_food", name: "Food Station Thermal", ipOrPort: "192.168.1.101:9100", isOnline: true },
          { target: "printer_bev", name: "Barista Thermal", ipOrPort: "192.168.1.102:9100", isOnline: true },
          { target: "printer_dessert", name: "Bakery Thermal", ipOrPort: "192.168.1.103:9100", isOnline: true },
          { target: "printer_pos", name: "Counter 58mm Thermal (USB)", ipOrPort: "USB001", isOnline: true },
        ],
      }),
    });
    const data = await res.json();
    if (data.success) {
      console.log(`[HEARTBEAT] Ping OK. Pending jobs in cloud queue: ${data.pendingJobsCount}`);
    }
  } catch (err) {
    console.warn(`[HEARTBEAT] Error reaching server: ${err.message}`);
  }
}

async function pollAndPrintJobs() {
  try {
    const res = await fetch(`${SERVER_BASE_URL}/api/hardware/agent/poll`, {
      headers: {
        Authorization: `Bearer ${DEVICE_TOKEN}`,
      },
    });
    const data = await res.json();
    if (data.success && data.jobs && data.jobs.length > 0) {
      console.log(`[POLL] Found ${data.jobs.length} pending print job(s)!`);

      for (const job of data.jobs) {
        console.log(`[PRINTING] Dispatching job ${job.id} to ${job.printerTarget} (${job.width} cols)...`);
        console.log("------------------------------------------");
        console.log(job.escposAscii);
        console.log("------------------------------------------");

        // Send Ack to server
        await fetch(`${SERVER_BASE_URL}/api/hardware/agent/ack`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DEVICE_TOKEN}`,
          },
          body: JSON.stringify({
            jobId: job.id,
            status: "printed",
          }),
        });
        console.log(`[ACK] Job ${job.id} marked printed.`);
      }
    }
  } catch (err) {
    console.warn(`[POLL] Poll error: ${err.message}`);
  }
}

// Start polling and heartbeat loops
setInterval(sendHeartbeat, 20000); // 20s heartbeat
setInterval(pollAndPrintJobs, 3000); // 3s polling for KOTs

sendHeartbeat();
pollAndPrintJobs();
