import { emailBaseLayout } from "./baseLayout.js";

export interface EventTicketTemplateProps {
  guestName: string;
  ongName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: string | null;
  ticketCode: string;
  eventUrl?: string;
}

export function eventTicketEmailTemplate({
  guestName,
  ongName,
  eventTitle,
  eventDate,
  eventLocation,
  ticketCode,
  eventUrl,
}: EventTicketTemplateProps): string {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="background-color: #ecfdf5; color: #059669; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 9999px; border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px;">
        ✓ Inscrição Confirmada
      </span>
    </div>

    <h2 style="color: #18181b; margin: 0 0 12px 0; font-size: 22px; font-weight: 800; text-align: center;">
      Seu Ingresso está Garantido!
    </h2>

    <p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
      Olá, <strong>${guestName}</strong>! Sua vaga no evento <strong>${eventTitle}</strong>, organizado pela <strong>${ongName}</strong>, foi confirmada com sucesso.
    </p>

    <!-- Ticket Pass Digital -->
    <div style="background-color: #ffffff; border: 2px dashed #7c3aed; border-radius: 16px; padding: 24px; margin: 24px 0; box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);">
      <div style="text-align: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 16px;">
        <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Código do Ingresso (Ticket Pass)</span>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 800; color: #6d28d9; letter-spacing: 2px; margin-top: 6px;">
          ${ticketCode}
        </div>
      </div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; line-height: 1.6;">
        <tr>
          <td style="padding-bottom: 8px; color: #64748b; width: 90px; font-weight: 600;">Evento:</td>
          <td style="padding-bottom: 8px; color: #0f172a; font-weight: 700;">${eventTitle}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px; color: #64748b; font-weight: 600;">Data/Hora:</td>
          <td style="padding-bottom: 8px; color: #0f172a; font-weight: 600;">📅 ${eventDate}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 4px; color: #64748b; font-weight: 600;">Local:</td>
          <td style="padding-bottom: 4px; color: #0f172a;">📍 ${eventLocation || "A definir / Informado pela organização"}</td>
        </tr>
      </table>
    </div>

    ${
      eventUrl
        ? `
    <div style="text-align: center; margin: 24px 0 16px 0;">
      <a href="${eventUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
        Ver Detalhes do Evento
      </a>
    </div>
    `
        : ""
    }

    <div style="background-color: #f8fafc; border-radius: 8px; padding: 12px 16px; margin: 20px 0 0 0;">
      <p style="color: #475569; font-size: 12.5px; line-height: 1.5; margin: 0; text-align: center;">
        💡 <strong>Dica:</strong> Salve este e-mail ou tire um print do código do ingresso para apresentar na recepção no dia do evento.
      </p>
    </div>
  `;

  return emailBaseLayout({
    title: `Ingresso Confirmado: ${eventTitle} - ONGManager`,
    previewText: `Seu ingresso para "${eventTitle}" está confirmado! Código: ${ticketCode}`,
    content,
  });
}
