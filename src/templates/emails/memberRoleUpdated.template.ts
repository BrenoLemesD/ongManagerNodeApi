import { emailBaseLayout } from "./baseLayout.js";

export interface MemberRoleUpdatedTemplateProps {
  userName: string;
  ongName: string;
  newRoleLabel: string;
  dashboardUrl: string;
}

export function memberRoleUpdatedEmailTemplate({
  userName,
  ongName,
  newRoleLabel,
  dashboardUrl,
}: MemberRoleUpdatedTemplateProps): string {
  const content = `
    <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">
      Atualização de Cargo / Permissões
    </h2>

    <p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
      Olá, <strong>${userName}</strong>! A administração da ONG <strong>${ongName}</strong> atualizou a sua função na plataforma.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
      <span style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Seu novo cargo:</span>
      <div style="font-size: 20px; font-weight: 800; color: #7c3aed; margin-top: 6px;">
        ${newRoleLabel}
      </div>
    </div>

    <p style="color: #3f3f46; font-size: 14.5px; line-height: 1.6; margin: 0 0 24px 0;">
      Seus privilégios de acesso e ferramentas disponíveis no painel da organização foram sincronizados conforme seu novo papel.
    </p>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${dashboardUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);">
        Acessar Meu Painel
      </a>
    </div>

    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
      Esta é uma notificação automática gerada pela gestão da sua ONG.
    </p>
  `;

  return emailBaseLayout({
    title: `Atualização de Cargo na ONG ${ongName} - ONGManager`,
    previewText: `Seu cargo na ONG ${ongName} foi alterado para ${newRoleLabel}.`,
    content,
  });
}
