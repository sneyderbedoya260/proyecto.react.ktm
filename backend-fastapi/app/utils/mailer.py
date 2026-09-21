import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

PLANTILLA_RECUPERACION = """
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
  <h2 style="color:#FF6600;">Recupera tu contraseña</h2>
  <p>Recibimos una solicitud para restablecer tu contraseña en KTM Store.</p>
  <p>
    <a href="{enlace}" style="background:#FF6600;color:#0D0D0D;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;display:inline-block;">
      Crear nueva contraseña
    </a>
  </p>
  <p>Este enlace vence en 1 hora. Si tú no solicitaste esto, ignora este correo.</p>
</div>
"""


def enviar_correo_recuperacion(destinatario: str, enlace: str) -> None:
    mensaje = MIMEMultipart("alternative")
    mensaje["Subject"] = "Recupera tu contraseña - KTM Store"
    mensaje["From"] = f"KTM Store <{settings.EMAIL_USER}>"
    mensaje["To"] = destinatario
    mensaje.attach(MIMEText(PLANTILLA_RECUPERACION.format(enlace=enlace), "html"))

    with smtplib.SMTP("smtp.gmail.com", 587) as servidor:
        servidor.starttls()
        servidor.login(settings.EMAIL_USER, settings.EMAIL_PASS)
        servidor.sendmail(settings.EMAIL_USER, destinatario, mensaje.as_string())
