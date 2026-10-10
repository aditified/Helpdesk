import nodemailer, { type Transporter } from "nodemailer";
import type { PgBoss } from "pg-boss";
import Sentry from "./sentry";

const QUEUE_NAME = "send-email";

export interface SendEmailJobData {
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  return transporter;
}

export async function registerSendEmailWorker(boss: PgBoss): Promise<void> {
  await boss.createQueue(QUEUE_NAME, {
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
  });

  await boss.work<SendEmailJobData>(QUEUE_NAME, async (jobs) => {
    const { to, subject, body, bodyHtml } = jobs[0]!.data;

    try {
      const mailer = getTransporter();
      if (!mailer) {
        console.log(
          `[Dev] SMTP not configured. Mock email to ${to} — subject: "${subject}"`
        );
        return;
      }

      const from = process.env.SMTP_FROM || process.env.SMTP_USER || "support@example.com";

      await mailer.sendMail({
        from,
        to,
        subject,
        text: body,
        ...(bodyHtml && { html: bodyHtml }),
      });

      console.log(`[SMTP] Email sent to ${to} — subject: "${subject}"`);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { queue: QUEUE_NAME },
      });
      throw error;
    }
  });
}

export async function sendEmailJob(data: SendEmailJobData): Promise<void> {
  const { boss } = await import("./queue");
  await boss.send(QUEUE_NAME, data);
}
