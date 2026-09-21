import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function enviarCorreoRecuperacion(destinatario, enlace) {
  await transporter.sendMail({
    from: `"KTM Store" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: 'Recupera tu contraseña - KTM Store',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#FF6600;">Recupera tu contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña en KTM Store.</p>
        <p>
          <a href="${enlace}" style="background:#FF6600;color:#0D0D0D;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;display:inline-block;">
            Crear nueva contraseña
          </a>
        </p>
        <p>Este enlace vence en 1 hora. Si tú no solicitaste esto, ignora este correo.</p>
      </div>
    `,
  });
}
