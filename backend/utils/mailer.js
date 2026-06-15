'use strict';

const nodemailer = require('nodemailer');

let transporterPromise = null;

// Lazily builds a transporter. If SMTP_* are configured, use real SMTP;
// otherwise spin up an Ethereal test account so emails are previewable in dev.
async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      return {
        transport: nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        }),
        dev: false,
      };
    }
    // Dev fallback: Ethereal preview inbox.
    const testAccount = await nodemailer.createTestAccount();
    return {
      transport: nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      }),
      dev: true,
    };
  })();

  return transporterPromise;
}

const FROM = process.env.MAIL_FROM || 'Дентални клиники MNL <no-reply@mnl-dental.bg>';

async function sendMail({ to, subject, html, text }) {
  const { transport, dev } = await getTransporter();
  const info = await transport.sendMail({ from: FROM, to, subject, html, text });
  if (dev) {
    const url = nodemailer.getTestMessageUrl(info);
    console.log(`📧  [DEV EMAIL] "${subject}" → ${to}`);
    if (url) console.log(`    Preview: ${url}`);
  }
  return info;
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

// Notifies the clinic about a new appointment request.
async function sendAppointmentToClinic(appt) {
  const to = process.env.ADMIN_EMAIL || 'clinic@mnl-dental.bg';
  const rows = [
    ['Име', appt.full_name],
    ['Телефон', appt.phone],
    ['Имейл', appt.email || '—'],
    ['Услуга', appt.service],
    ['Желана дата', appt.preferred_date],
    ['Желан час', appt.preferred_time],
    ['Бележка', appt.note || '—'],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;color:#1A6B42">${k}</td><td style="padding:6px 12px">${escapeHtml(
          v
        )}</td></tr>`
    )
    .join('');
  return sendMail({
    to,
    subject: `🦷 Нова заявка за час — ${appt.full_name}`,
    html: `<h2 style="font-family:sans-serif;color:#1A6B42">Нова заявка за час</h2>
      <table style="font-family:sans-serif;border-collapse:collapse">${rows}</table>`,
    text: `Нова заявка: ${appt.full_name}, ${appt.phone}, ${appt.service}, ${appt.preferred_date} ${appt.preferred_time}`,
  });
}

// Sends a confirmation copy to the patient (only if they supplied an email).
async function sendAppointmentToPatient(appt) {
  if (!appt.email) return null;
  return sendMail({
    to: appt.email,
    subject: 'Получихме вашата заявка — Дентални клиники MNL',
    html: `<div style="font-family:sans-serif;color:#1A2E1E">
        <h2 style="color:#1A6B42">Благодарим Ви, ${escapeHtml(appt.full_name)}!</h2>
        <p>Получихме вашата заявка за <strong>${escapeHtml(appt.service)}</strong> на
        <strong>${appt.preferred_date}</strong> в <strong>${appt.preferred_time}</strong>.</p>
        <p>Наш служител ще се свърже с Вас на телефон <strong>${escapeHtml(
          appt.phone
        )}</strong>, за да потвърди часа.</p>
        <p style="color:#5A7A5E">📍 бл. 418, Младост 4, вх. 1 – партер, 1715 София<br>📞 089 728 8776</p>
        <p style="color:#2E8B5A;font-weight:600">Дентални клиники MNL</p>
      </div>`,
    text: `Благодарим, ${appt.full_name}! Получихме заявката Ви за ${appt.service} на ${appt.preferred_date} ${appt.preferred_time}.`,
  });
}

module.exports = { sendMail, sendAppointmentToClinic, sendAppointmentToPatient };
