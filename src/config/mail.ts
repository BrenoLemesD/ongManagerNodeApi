import nodemailer, { Transporter } from "nodemailer";
import { env } from "./env.js";

let transporterPromise: Promise<Transporter> | null = null;

async function getTransporter(): Promise<Transporter> {
  if (transporterPromise) {
    return transporterPromise;
  }

  transporterPromise = (async () => {
    const host = env.SMTP_HOST || process.env.SMTP_HOST;
    const user = env.SMTP_USER || process.env.SMTP_USER;
    const pass = env.SMTP_PASS || process.env.SMTP_PASS;
    const port = Number(env.SMTP_PORT || process.env.SMTP_PORT) || 587;
    const secure = (env.SMTP_SECURE || process.env.SMTP_SECURE) === "true";

    if (host && user && pass) {
      console.log(`[MAIL] Conectando ao provedor SMTP configurado: ${host}:${port} com o usuário ${user}...`);
      return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: user.trim(),
          pass: pass.replace(/\s+/g, ""),
        },
      });
    }

    // Caso contrário (modo desenvolvimento/TCC 100% gratuito), utiliza Ethereal Email automático
    console.log("[MAIL] Gerando conta de teste gratuita Ethereal Email...");
    const testAccount = await nodemailer.createTestAccount();
    console.log(`[MAIL] Conta Ethereal criada: ${testAccount.user}`);

    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  })();

  return transporterPromise;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailOptions): Promise<void> {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: env.SMTP_FROM || process.env.SMTP_FROM || '"ONGManager" <noreply@ongmanager.org>',
      to,
      subject,
      html,
    });

    console.log(`[MAIL] E-mail enviado com sucesso para ${to}. MessageId: ${info.messageId}`);

    // Se estiver usando Ethereal, exibe o link do preview visual no console
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[MAIL][PREVIEW URL] Clique para ver o e-mail no navegador: ${previewUrl}`);
    }
  } catch (error) {
    console.error("[MAIL] Erro ao enviar e-mail:", error);
    throw error;
  }
}

export async function sendMailSafe(options: SendMailOptions): Promise<boolean> {
  try {
    await sendMail(options);
    return true;
  } catch (error) {
    console.error(`[MAIL][SAFE] Falha não impeditiva ao enviar e-mail para ${options.to}:`, error);
    return false;
  }
}
