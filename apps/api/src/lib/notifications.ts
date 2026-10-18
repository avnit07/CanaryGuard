// ═══════════════════════════════════════════════════════
// CanaryGuard — Webhook & Notification Dispatcher
// Sends real-time alerts to Slack, Discord, & PagerDuty
// ═══════════════════════════════════════════════════════

export interface NotificationPayload {
  event: "AUTO_ROLLBACK" | "APPROVAL_REQUIRED" | "CANARY_PROMOTED" | "ANOMALY_DETECTED";
  serviceName: string;
  version: string;
  deploymentId: string;
  summary: string;
  details?: Record<string, unknown>;
}

/**
 * Dispatch webhook alert to configured Slack/Discord/Webhook URLs
 */
export async function dispatchNotification(payload: NotificationPayload): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.WEBHOOK_URL;

  console.log(`[Notification Engine] Event '${payload.event}' triggered for ${payload.serviceName} (${payload.version})`);

  if (!webhookUrl) {
    console.log(`[Notification Engine] No SLACK_WEBHOOK_URL configured. Logging payload locally:`, JSON.stringify(payload, null, 2));
    return true;
  }

  try {
    const color = payload.event === "AUTO_ROLLBACK" ? "#ef4444" : payload.event === "CANARY_PROMOTED" ? "#10b981" : "#f59e0b";

    const slackBody = {
      attachments: [
        {
          color,
          title: `🛡️ CanaryGuard Alert: ${payload.event.replace("_", " ")}`,
          title_link: `http://localhost:3000/deployments/${payload.deploymentId}`,
          text: `*Service:* ${payload.serviceName} (${payload.version})\n*Summary:* ${payload.summary}`,
          fields: [
            { title: "Service", value: payload.serviceName, short: true },
            { title: "Version", value: payload.version, short: true },
            { title: "Deployment ID", value: payload.deploymentId, short: true },
            { title: "Event Type", value: payload.event, short: true },
          ],
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackBody),
    });

    return res.ok;
  } catch (err) {
    console.error("[Notification Engine Error]: Failed to send webhook", err);
    return false;
  }
}
