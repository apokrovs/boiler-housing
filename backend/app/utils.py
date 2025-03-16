import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import emails  # type: ignore
import jwt
from jinja2 import Template
from jwt.exceptions import InvalidTokenError

from app.core import security
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class EmailData:
    html_content: str
    subject: str


def render_email_template(*, template_name: str, context: dict[str, Any]) -> str:
    template_str = (
            Path(__file__).parent / "email-templates" / "build" / template_name
    ).read_text()
    html_content = Template(template_str).render(context)
    return html_content


def send_email(
        *,
        email_to: str,
        subject: str = "",
        html_content: str = "",
) -> None:
    assert settings.emails_enabled, "no provided configuration for email variables"

    # Add detailed logging of all settings
    logger.info(f"SMTP_HOST: {settings.SMTP_HOST}")
    logger.info(f"SMTP_PORT: {settings.SMTP_PORT}")
    logger.info(f"SMTP_USER: {settings.SMTP_USER}")
    logger.info(f"SMTP_PASSWORD: {'*' * 8 if settings.SMTP_PASSWORD else 'None'}")
    logger.info(f"SMTP_TLS: {settings.SMTP_TLS}")
    logger.info(f"SMTP_SSL: {settings.SMTP_SSL}")
    logger.info(f"EMAILS_FROM_EMAIL: {settings.EMAILS_FROM_EMAIL}")

    message = emails.Message(
        subject=subject,
        html=html_content,
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}
    if settings.SMTP_TLS:
        smtp_options["tls"] = True
    elif settings.SMTP_SSL:
        smtp_options["ssl"] = True
    if settings.SMTP_USER:
        smtp_options["user"] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp_options["password"] = settings.SMTP_PASSWORD

    # Log complete SMTP options
    safe_smtp_options = smtp_options.copy()
    if 'password' in safe_smtp_options:
        safe_smtp_options['password'] = '******'
    logger.info(f"SMTP options: {safe_smtp_options}")

    try:
        response = message.send(to=email_to, smtp=smtp_options)
        logger.info(f"Email sent to {email_to}")
        logger.info(f"send email result: {response}")
        response_dict = response.__dict__.copy() if hasattr(response, '__dict__') else {}
        if 'smtp_options' in response_dict and 'password' in response_dict['smtp_options']:
            response_dict['smtp_options'] = {**response_dict['smtp_options'], 'password': '******'}
        logger.info(f"Response details: {response_dict}")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        raise


def generate_test_email(email_to: str) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Test email"
    html_content = render_email_template(
        template_name="test_email.html",
        context={"project_name": settings.PROJECT_NAME, "email": email_to},
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_reset_password_email(email_to: str, email: str, token: str) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Password recovery for user {email}"
    link = f"{settings.FRONTEND_HOST}/reset-password?token={token}"
    html_content = render_email_template(
        template_name="reset_password.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": email,
            "email": email_to,
            "valid_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": link,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_new_account_email(
        email_to: str, username: str, password: str
) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - New account for user {username}"
    html_content = render_email_template(
        template_name="new_account.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "password": password,
            "email": email_to,
            "link": settings.FRONTEND_HOST,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.now(timezone.utc)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        settings.SECRET_KEY,
        algorithm=security.ALGORITHM,
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> str | None:
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        return str(decoded_token["sub"])
    except InvalidTokenError:
        return None
