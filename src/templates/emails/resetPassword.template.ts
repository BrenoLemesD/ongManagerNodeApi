import { emailBaseLayout } from "./baseLayout.js";

export interface ResetPasswordTemplateProps {
  name: string;
  resetUrl: string;
}

export function resetPasswordEmailTemplate({
  name,
  resetUrl,
}: ResetPasswordTemplateProps): string {
  const content = `
    <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">Recuperação de Acesso</h2>
    <p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 14px 0;">
      Olá, <strong>${name}</strong>!
    </p>
    <p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
      Recebemos uma solicitação para redefinir a sua senha de acesso à plataforma <strong>ONGManager</strong>. Clique no botão seguro abaixo para cadastrar uma nova senha:
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
        Redefinir Minha Senha
      </a>
    </div>
    
    <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 14px 16px; margin: 24px 0 0 0;">
      <p style="color: #6b21a8; font-size: 13px; line-height: 1.5; margin: 0;">
        ⏱️ <strong>Validade:</strong> Este link é temporário e expira em <strong>1 hora</strong> por motivos de segurança.
      </p>
    </div>

    <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #f4f4f5; padding-top: 16px;">
      Se você não solicitou a alteração de senha, ignore este e-mail. Nenhuma alteração foi realizada e sua conta permanece totalmente segura.
    </p>
  `;

  return emailBaseLayout({
    title: "Recuperação de Senha - ONGManager",
    previewText: "Instruções para redefinir sua senha no ONGManager",
    content,
  });
}
