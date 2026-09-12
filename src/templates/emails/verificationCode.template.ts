import { emailBaseLayout } from "./baseLayout.js";

export interface VerificationCodeTemplateProps {
  code: string;
  ongName?: string;
}

export function verificationCodeEmailTemplate({
  code,
  ongName,
}: VerificationCodeTemplateProps): string {
  const content = `
    <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">Confirmação de E-mail</h2>
    <p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 14px 0;">
      Olá!
    </p>
    <p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
      ${
        ongName
          ? `Para confirmar o cadastro da sua ONG <strong>${ongName}</strong> na plataforma <strong>ONGManager</strong>, utilize o código de verificação abaixo:`
          : `Para confirmar a validação do seu e-mail na plataforma <strong>ONGManager</strong>, utilize o código de verificação abaixo:`
      }
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border: 2px dashed #7c3aed; border-radius: 12px; padding: 18px 36px;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #6d28d9; display: block; margin-left: 8px;">
          ${code}
        </span>
      </div>
    </div>
    
    <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 14px 16px; margin: 24px 0 0 0;">
      <p style="color: #6b21a8; font-size: 13px; line-height: 1.5; margin: 0;">
        ⏱️ <strong>Validade:</strong> Este código expira em <strong>10 minutos</strong>. Insira-o na tela de cadastro antes que expire.
      </p>
    </div>

    <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #f4f4f5; padding-top: 16px;">
      Se você não solicitou este código de validação, por favor ignore este e-mail. Nenhuma ação será tomada sem a inserção do código.
    </p>
  `;

  return emailBaseLayout({
    title: "Código de Verificação - ONGManager",
    previewText: `Seu código de confirmação no ONGManager é ${code}`,
    content,
  });
}
