// Email transport for order notifications.
//
// The order already exists in the database by the time this runs, so a failed
// send is a degraded notification, never a lost sale. Every path here returns
// instead of throwing, and the panel remains the source of truth.

type SendInput = {
  to: string;
  subject: string;
  text: string;
};

export type SendResult =
  | { sent: true }
  | { sent: false; reason: "not-configured" | "failed"; detail?: string };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.ORDER_NOTIFICATION_FROM);
}

export async function sendEmail({ to, subject, text }: SendInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_NOTIFICATION_FROM;

  // Until a sending domain exists there is nothing to send through, and that is
  // a configuration state rather than an error: the ticket in the panel is what
  // the producer works from either way.
  if (!apiKey || !from) {
    console.info("[email] not configured; skipping notification", { subject });
    return { sent: false, reason: "not-configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("[email] send failed", response.status, detail);
      return { sent: false, reason: "failed", detail };
    }

    return { sent: true };
  } catch (error) {
    console.error("[email] send threw", error);
    return {
      sent: false,
      reason: "failed",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
