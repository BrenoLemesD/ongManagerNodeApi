import { sendMail } from "../config/mail.js";
import { resetPasswordEmailTemplate } from "../templates/emails/resetPassword.template.js";
import { verificationCodeEmailTemplate } from "../templates/emails/verificationCode.template.js";
import { taskAssignedEmailTemplate } from "../templates/emails/taskAssigned.template.js";
import { taskCompletedEmailTemplate } from "../templates/emails/taskCompleted.template.js";
import { eventTicketEmailTemplate } from "../templates/emails/eventTicket.template.js";
import { volunteerWelcomeEmailTemplate } from "../templates/emails/volunteerWelcome.template.js";
import { memberRoleUpdatedEmailTemplate } from "../templates/emails/memberRoleUpdated.template.js";
import { passwordChangedEmailTemplate } from "../templates/emails/passwordChanged.template.js";

const TARGET_EMAIL = "ongmanager.contact@gmail.com";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log(`\n🚀 Disparando todos os 8 tipos de e-mails transacionais para: ${TARGET_EMAIL}\n`);

  // 1. Redefinição de Senha
  console.log("1/8 Enviando: Recuperação de Senha...");
  await sendMail({
    to: TARGET_EMAIL,
    subject: "1. [Recuperação de Senha] Instruções para redefinir seu acesso",
    html: resetPasswordEmailTemplate({
      name: "Breno Lemes",
      resetUrl: "http://localhost:5173/reset-password?token=demo-token-123456",
    }),
  });
  await sleep(1200);

  // 2. Código de Verificação ao Criar ONG (10 min)
  console.log("2/8 Enviando: Código de Verificação (10 min)...");
  await sendMail({
    to: TARGET_EMAIL,
    subject: "2. [Código de Verificação] Confirme seu e-mail para criar a ONG",
    html: verificationCodeEmailTemplate({
      code: "849203",
      ongName: "Instituto Esperança Viva",
    }),
  });
  await sleep(1200);

  // 3. Tarefa Atribuída no Kanban
  console.log("3/8 Enviando: Nova Tarefa Atribuída...");
  await sendMail({
    to: TARGET_EMAIL,
    subject: "3. [Nova Tarefa Atribuída] Organizar Bazar Beneficente 2026",
    html: taskAssignedEmailTemplate({
      userName: "Breno Lemes",
      ongName: "Instituto Esperança Viva",
      taskTitle: "Organizar Bazar Beneficente e Triagem de Doações",
      taskDescription: "Separar roupas e calçados por tamanho, precificar itens e montar a estrutura de caixas no pátio principal da sede.",
      priority: "alta",
      deadline: "25/09/2026",
      assignedByName: "Coordenação Geral",
      boardUrl: "http://localhost:5173/kanban",
    }),
  });
  await sleep(1200);

  // 4. Tarefa Finalizada (Alerta aos Administradores)
  console.log("4/8 Enviando: Tarefa Concluída (Alerta aos Admins)...");
  await sendMail({
    to: TARGET_EMAIL,
    subject: "4. [Tarefa Finalizada] Entrega de 150 Cestas Básicas às Famílias",
    html: taskCompletedEmailTemplate({
      adminName: "Breno Lemes",
      ongName: "Instituto Esperança Viva",
      taskTitle: "Entrega de 150 Cestas Básicas às Famílias Cadastradas",
      taskDescription: "Distribuição concluída com sucesso no bairro Jardim Primavera. Todos os comprovantes de entrega foram assinados.",
      completedByName: "Maria Souza (Voluntária Líder)",
      completedByEmail: "maria.souza@ongesperanca.org",
      completedAt: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      taskPriority: "urgente",
      boardUrl: "http://localhost:5173/kanban",
    }),
  });
  await sleep(1200);

  // 5. Ingresso Confirmado de Evento Social
  console.log("5/8 Enviando: Ingresso Confirmado (Ticket Pass)...");
  await sendMail({
    to: TARGET_EMAIL,
    subject: "5. [Ingresso Confirmado] 10ª Noite da Pizza Solidária",
    html: eventTicketEmailTemplate({
      guestName: "Breno Lemes",
      ongName: "Instituto Esperança Viva",
      eventTitle: "10ª Noite da Pizza Solidária & Música ao Vivo",
      eventDate: "15 de Outubro de 2026 às 19:30",
      eventLocation: "Salão Comunitário São José - Rua das Flores, 500",
      ticketCode: "EVT-SOLIDARIO-9421",
      eventUrl: "http://localhost:5173/eventos/demo-evento-id",
    }),
  });
  await sleep(1200);

  // 6. Boas-vindas ao Voluntário Cadastrado
  console.log("6/8 Enviando: Boas-vindas ao Voluntário...");
  await sendMail({
    to: TARGET_EMAIL,
    subject: "6. [Boas-vindas] Bem-vindo(a) à equipe do Instituto Esperança Viva!",
    html: volunteerWelcomeEmailTemplate({
      userName: "Breno Lemes",
      ongName: "Instituto Esperança Viva",
      userEmail: TARGET_EMAIL,
      roleTitle: "Voluntário(a) de Ação Social",
      loginUrl: "http://localhost:5173/",
    }),
  });
  await sleep(1200);

  // 7. Atualização / Promoção de Cargo
  console.log("7/8 Enviando: Atualização de Cargo...");
  await sendMail({
    to: TARGET_EMAIL,
    subject: "7. [Atualização de Cargo] Seu papel na ONG foi promovido para Gestor(a) Financeiro",
    html: memberRoleUpdatedEmailTemplate({
      userName: "Breno Lemes",
      ongName: "Instituto Esperança Viva",
      newRoleLabel: "Gestor(a) Financeiro",
      dashboardUrl: "http://localhost:5173/dashboard",
    }),
  });
  await sleep(1200);

  // 8. Alerta de Segurança: Senha Alterada
  console.log("8/8 Enviando: Alerta de Segurança (Senha Alterada)...");
  await sendMail({
    to: TARGET_EMAIL,
    subject: "8. [Alerta de Segurança] A senha da sua conta foi alterada",
    html: passwordChangedEmailTemplate({
      userName: "Breno Lemes",
      changedAt: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      supportUrl: "http://localhost:5173/forgot-password",
    }),
  });

  console.log("\n🎉 TODOS OS 8 E-MAILS FORAM DISPARADOS COM SUCESSO!\n");
}

run().catch((err) => {
  console.error("❌ Erro ao disparar e-mails:", err);
  process.exit(1);
});
