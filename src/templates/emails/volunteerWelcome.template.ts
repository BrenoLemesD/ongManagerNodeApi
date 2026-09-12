import { emailBaseLayout } from "./baseLayout.js";

export interface VolunteerWelcomeTemplateProps {
  userName: string;
  ongName: string;
  userEmail: string;
  roleTitle?: string;
  loginUrl: string;
}

export function volunteerWelcomeEmailTemplate({
  userName,
  ongName,
  userEmail,
  roleTitle = "Voluntário(a)",
  loginUrl,
}: VolunteerWelcomeTemplateProps): string {
  const content = `
    <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 22px; font-weight: 700;">
      Bem-vindo(a) à Equipe! 🎉
    </h2>

    <p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
      Olá, <strong>${userName}</strong>! Você foi cadastrado(a) como <strong>${roleTitle}</strong> na organização <strong>${ongName}</strong> através da plataforma <strong>ONGManager</strong>.
    </p>

    <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #6b21a8; margin: 0 0 10px 0; font-size: 15px; font-weight: 700;">
        Seus Dados de Acesso:
      </h3>
      <p style="color: #3f3f46; font-size: 14px; margin: 0 0 6px 0;">
        <strong>E-mail:</strong> ${userEmail}
      </p>
      <p style="color: #3f3f46; font-size: 14px; margin: 0;">
        <strong>Organização:</strong> ${ongName}
      </p>
    </div>

    <p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
      Agora você tem acesso ao painel para acompanhar tarefas atribuídas a você, participar de eventos e colaborar ativamente com a causa da instituição.
    </p>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${loginUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 13px 34px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);">
        Acessar a Plataforma
      </a>
    </div>

    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
      Caso tenha dúvidas sobre suas credenciais, contate diretamente o administrador responsável pela sua ONG.
    </p>
  `;

  return emailBaseLayout({
    title: `Bem-vindo(a) à ONG ${ongName} - ONGManager`,
    previewText: `Você agora faz parte da equipe da ONG ${ongName}! Acesse seu painel.`,
    content,
  });
}
