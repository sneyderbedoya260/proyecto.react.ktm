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


def correo_configurado() -> bool:
    return bool(settings.EMAIL_USER and settings.EMAIL_PASS)


def enviar_correo_recuperacion(destinatario: str, enlace: str) -> bool:
    """Envía el correo de recuperación. Devuelve False si no se pudo enviar.

    No lanza excepción a propósito: si el SMTP no está configurado o falla, el
    token de recuperación ya quedó guardado y el resto del flujo debe seguir
    funcionando en vez de responder un error al usuario.
    """
    if not correo_configurado():
        print("[mailer] EMAIL_USER/EMAIL_PASS sin configurar; no se envió el correo.")
        print(f"[mailer] Enlace de recuperación para {destinatario}: {enlace}")
        return False

    mensaje = MIMEMultipart("alternative")
    mensaje["Subject"] = "Recupera tu contraseña - KTM Store"
    mensaje["From"] = f"KTM Store <{settings.EMAIL_USER}>"
    mensaje["To"] = destinatario
    mensaje.attach(MIMEText(PLANTILLA_RECUPERACION.format(enlace=enlace), "html"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as servidor:
            servidor.starttls()
            servidor.login(settings.EMAIL_USER, settings.EMAIL_PASS)
            servidor.sendmail(settings.EMAIL_USER, destinatario, mensaje.as_string())
        return True
    except Exception as error:  # noqa: BLE001
        print(f"[mailer] No se pudo enviar el correo a {destinatario}: {error!r}")
        return False
