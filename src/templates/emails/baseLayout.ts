export interface EmailBaseLayoutProps {
  title: string;
  previewText?: string;
  content: string;
}

/**
 * Layout base responsivo para todos os e-mails transacionais do ONGManager.
 * Compatível com Gmail (Web e Mobile), Outlook, Apple Mail e clientes modernos.
 */
export function emailBaseLayout({
  title,
  previewText = "Notificação da plataforma ONGManager",
  content,
}: EmailBaseLayoutProps): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @media only screen and (max-width: 600px) {
          .email-card { width: 100% !important; border-radius: 8px !important; }
          .email-body { padding: 24px 20px !important; }
          .email-header { padding: 28px 20px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
        ${previewText}
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" class="email-card" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #e4e4e7;">
              <!-- Topo / Banner com Gradiente e Logo -->
              <tr>
                <td class="email-header" style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 36px 32px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">ONGManager</h1>
                  <p style="color: #e9d5ff; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">Gestão Inteligente para Organizações Sociais</p>
                </td>
              </tr>
              <!-- Conteúdo Específico -->
              <tr>
                <td class="email-body" style="padding: 36px 32px;">
                  ${content}
                </td>
              </tr>
              <!-- Rodapé Transacional -->
              <tr>
                <td style="background-color: #fafafa; padding: 20px 32px; border-top: 1px solid #f4f4f5; text-align: center;">
                  <p style="color: #71717a; font-size: 12px; margin: 0 0 4px 0;">
                    ONGManager &bull; Gestão Social &bull; São Paulo, Brasil
                  </p>
                  <p style="color: #a1a1aa; font-size: 11px; margin: 0;">
                    Este é um e-mail transacional gerado automaticamente. Por favor, não responda.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
