import { emailBaseLayout } from "./baseLayout.js";

export interface TaskCompletedTemplateProps {
  adminName: string;
  ongName: string;
  taskTitle: string;
  taskDescription?: string | null;
  completedByName: string;
  completedByEmail: string;
  completedAt: string;
  taskPriority?: string;
  boardUrl: string;
}

export function taskCompletedEmailTemplate({
  adminName,
  ongName,
  taskTitle,
  taskDescription,
  completedByName,
  completedByEmail,
  completedAt,
  taskPriority = "media",
  boardUrl,
}: TaskCompletedTemplateProps): string {
  const priorityLabels: Record<string, { text: string; color: string; bg: string }> = {
    baixa: { text: "Baixa", color: "#16a34a", bg: "#f0fdf4" },
    media: { text: "Média", color: "#ca8a04", bg: "#fefce8" },
    alta: { text: "Alta", color: "#ea580c", bg: "#fff7ed" },
    urgente: { text: "Urgente", color: "#dc2626", bg: "#fef2f2" },
  };

  const priorityBadge = priorityLabels[taskPriority.toLowerCase()] || priorityLabels.media;

  const content = `
    <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">
      Notificação de Conclusão de Tarefa
    </h2>

    <p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
      Olá, <strong>${adminName}</strong>! Uma tarefa acaba de ser finalizada no quadro Kanban da <strong>${ongName}</strong>.
    </p>

    <!-- Card de Detalhes da Conclusão -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; line-height: 1.6;">
        <tr>
          <td style="padding-bottom: 10px; color: #64748b; width: 140px; font-weight: 600;">Tarefa Finalizada:</td>
          <td style="padding-bottom: 10px; color: #0f172a; font-weight: 700; font-size: 16px;">${taskTitle}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 10px; color: #64748b; font-weight: 600;">Finalizada por:</td>
          <td style="padding-bottom: 10px; color: #0f172a; font-weight: 600;">
            ${completedByName} <span style="color: #64748b; font-weight: 400;">(${completedByEmail})</span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 10px; color: #64748b; font-weight: 600;">Data e Horário:</td>
          <td style="padding-bottom: 10px; color: #0f172a;">${completedAt}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 10px; color: #64748b; font-weight: 600;">Prioridade:</td>
          <td style="padding-bottom: 10px;">
            <span style="display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; color: ${priorityBadge.color}; background-color: ${priorityBadge.bg}; border: 1px solid ${priorityBadge.color}30;">
              ${priorityBadge.text}
            </span>
          </td>
        </tr>
        ${
          taskDescription
            ? `
        <tr>
          <td style="vertical-align: top; padding-top: 4px; color: #64748b; font-weight: 600;">Descrição:</td>
          <td style="vertical-align: top; padding-top: 4px; color: #334155; font-style: italic;">
            "${taskDescription}"
          </td>
        </tr>
        `
            : ""
        }
      </table>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${boardUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);">
        Ver no Quadro Kanban
      </a>
    </div>

    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
      Você recebeu este e-mail por ser administrador da ONG <strong>${ongName}</strong>.
    </p>
  `;

  return emailBaseLayout({
    title: `Tarefa Finalizada: ${taskTitle} - ONGManager`,
    previewText: `${completedByName} finalizou a tarefa "${taskTitle}" na ONG ${ongName}.`,
    content,
  });
}
