import { emailBaseLayout } from "./baseLayout.js";

export interface PasswordChangedTemplateProps {
  userName: string;
  changedAt: string;
  supportUrl?: string;
}

export function passwordChangedEmailTemplate({
  userName,
  changedAt,
  supportUrl,
}: PasswordChangedTemplateProps): string {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="background-color: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 9999px; border: 1px solid #fecaca; text-transform: uppercase; letter-spacing: 0.5px;">
        🛡️ Alerta de Segurança
      </span>
    </div>

    <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 20px; font-weight: 700; text-align: center;">
      Sua Senha foi Alterada
    </h2>

    <p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
      Olá, <strong>${userName}</strong>! Confirmamos que a senha da sua conta no <strong>ONGManager</strong> foi atualizada com sucesso em <strong>${changedAt}</strong>.
    </p>

    <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <p style="color: #9a3412; font-size: 13.5px; line-height: 1.5; margin: 0;">
        ⚠️ <strong>Você reconhece esta alteração?</strong><br>
        Se foi você quem alterou, nenhuma ação adicional é necessária. Caso você <strong>não</strong> tenha realizado esta operação, sua conta pode estar comprometida.
      </p>
    </div>

    ${
      supportUrl
        ? `
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${supportUrl}" style="background-color: #dc2626; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);">
        Recuperar Minha Conta Imediatamente
      </a>
    </div>
    `
        : ""
    }

    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
      Por questões de segurança, sempre utilize senhas fortes e exclusivas para cada serviço.
    </p>
  `;

  return emailBaseLayout({
    title: "Alerta de Segurança: Senha Alterada - ONGManager",
    previewText: "A senha da sua conta no ONGManager foi alterada.",
    content,
  });
}
