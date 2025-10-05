# email_service.py
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_username)
        self.from_name = os.getenv("FROM_NAME", "NovaOS")

    async def send_password_reset_email(
        self, to_email: str, reset_token: str, user_name: str = None
    ) -> bool:
        """Send password reset email"""
        try:
            reset_url = (
                f"https://novaos.blackrosecollective.studio/auth/reset-password?token={reset_token}"
            )

            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Password Reset - NovaOS</title>
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #777; font-size: 0.9em; }}
                    .warning {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Reset Request</h1>
                        <p>NovaOS Security System</p>
                    </div>
                    <div class="content">
                        <p>Hello {user_name or 'User'},</p>

                        <p>We received a request to reset your password for your NovaOS account. If you made this request, click the button below to reset your password:</p>

                        <div style="text-align: center;">
                            <a href="{reset_url}" class="button">Reset My Password</a>
                        </div>

                        <p>This link will expire in 1 hour for security reasons.</p>

                        <div class="warning">
                            <strong>⚠️ Security Notice:</strong><br>
                            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                        </div>

                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px;">{reset_url}</p>

                        <p>For security questions, contact our support team.</p>

                        <p>Best regards,<br>The NovaOS Security Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from NovaOS. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """

            text_content = f"""
            Password Reset Request - NovaOS

            Hello {user_name or 'User'},

            We received a request to reset your password for your NovaOS account.

            To reset your password, visit this link:
            {reset_url}

            This link will expire in 1 hour for security reasons.

            If you didn't request this password reset, please ignore this email.

            Best regards,
            The NovaOS Security Team
            """

            return await self._send_email(
                to_email=to_email,
                subject="🔐 Password Reset Request - NovaOS",
                html_content=html_content,
                text_content=text_content,
            )

        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")
            return False

    async def send_password_changed_notification(
        self, to_email: str, user_name: str = None
    ) -> bool:
        """Send password change confirmation email"""
        try:
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Password Changed - NovaOS</title>
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #777; font-size: 0.9em; }}
                    .warning {{ background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Password Successfully Changed</h1>
                        <p>NovaOS Security System</p>
                    </div>
                    <div class="content">
                        <p>Hello {user_name or 'User'},</p>

                        <p>Your NovaOS account password has been successfully changed.</p>

                        <p><strong>Change Details:</strong></p>
                        <ul>
                            <li>Account: {to_email}</li>
                            <li>Changed: Just now</li>
                            <li>IP: [Logged for security]</li>
                        </ul>

                        <div class="warning">
                            <strong>⚠️ Didn't make this change?</strong><br>
                            If you didn't change your password, your account may be compromised. Please contact our security team immediately.
                        </div>

                        <p>Your account is now secured with your new password.</p>

                        <p>Best regards,<br>The NovaOS Security Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated security notification from NovaOS.</p>
                    </div>
                </div>
            </body>
            </html>
            """

            return await self._send_email(
                to_email=to_email, subject="✅ Password Changed - NovaOS", html_content=html_content
            )

        except Exception as e:
            logger.error(f"Failed to send password change notification: {e}")
            return False

    async def _send_email(
        self, to_email: str, subject: str, html_content: str, text_content: str = None
    ) -> bool:
        """Send email using SMTP"""
        if not self.smtp_username or not self.smtp_password:
            logger.warning("Email service not configured - SMTP credentials missing")
            return False

        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email

            # Add text and HTML parts
            if text_content:
                text_part = MIMEText(text_content, "plain")
                msg.attach(text_part)

            html_part = MIMEText(html_content, "html")
            msg.attach(html_part)

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False


# Global email service instance
email_service = EmailService()
