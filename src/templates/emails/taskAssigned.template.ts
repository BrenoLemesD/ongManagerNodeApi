import { emailBaseLayout } from "./baseLayout.js";

export interface TaskAssignedTemplateProps {
  userName: string;
  ongName: string;
  taskTitle: string;
  taskDescription?: string | null;
  priority?: string;
  deadline?: string | null;
  assignedByName: string;
  boardUrl: string;
}

export function taskAssignedEmailTemplate({
  userName,
  ongName,
  taskTitle,
  taskDescription,
  priority = "media",
  deadline,
  assignedByName,
  boardUrl,
}: TaskAssignedTemplateProps): string {
  const priorityLabels: Record<string, { text: string; color: string; bg: string }> = {
    baixa: { text: "Baixa", color: "#16a34a", bg: "#f0fdf4" },
    media: { text: "Média", color: "#ca8a04", bg: "#fefce8" },
    alta: { text: "Alta", color: "#ea580c", bg: "#fff7ed" },
    urgente: { text: "Urgente", color: "#dc2626", bg: "#fef2f2" },
  };

  const priorityBadge = priorityLabels[priority.toLowerCase()] || priorityLabels.media;

  const content = `
    <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">
      Nova Tarefa Atribuída a Você
    </h2>

    <p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
      Olá, <strong>${userName}</strong>! Uma nova atividade foi designada para você na ONG <strong>${ongName}</strong> por <strong>${assignedByName}</strong>:
    </p>

    <!-- Card da Tarefa -->
    <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border: 1px solid #d8b4fe; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #581c87; margin: 0 0 12px 0; font-size: 18px; font-weight: 700;">
        ${taskTitle}
      </h3>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; line-height: 1.6;">
        <tr>
          <td style="padding-bottom: 8px; color: #7e22ce; width: 120px; font-weight: 600;">Prioridade:</td>
          <td style="padding-bottom: 8px;">
            <span style="display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; color: ${priorityBadge.color}; background-color: ${priorityBadge.bg}; border: 1px solid ${priorityBadge.color}30;">
              ${priorityBadge.text}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px; color: #7e22ce; font-weight: 600;">Prazo Limite:</td>
          <td style="padding-bottom: 8px; color: #1e1b4b; font-weight: 600;">
            ${deadline ? `📅 ${deadline}` : "Sem prazo definido"}
          </td>
        </tr>
        ${
          taskDescription
            ? `
        <tr>
          <td style="vertical-align: top; padding-top: 4px; color: #7e22ce; font-weight: 600;">Descrição:</td>
          <td style="vertical-align: top; padding-top: 4px; color: #3b0764; font-size: 13.5px;">
            ${taskDescription}
          </td>
        </tr>
        `
            : ""
        }
      </table>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${boardUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);">
        Acessar Tarefa no Kanban
      </a>
    </div>

    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
      Mantenha o quadro atualizado arrastando os cards conforme avançar no desenvolvimento desta atividade.
    </p>
  `;

  return emailBaseLayout({
    title: `Nova Tarefa: ${taskTitle} - ONGManager`,
    previewText: `Você recebeu uma nova tarefa na ONG ${ongName}: "${taskTitle}"`,
    content,
  });
}
