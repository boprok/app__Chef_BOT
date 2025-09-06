"""Email service using Resend for email verification"""
import resend
import os
from typing import Optional
from config.settings import settings

class EmailService:
    def __init__(self):
        """Initialize Resend with API key"""
        self.api_key = settings.RESEND_API_KEY
        if self.api_key:
            resend.api_key = self.api_key
    
    async def send_verification_email(self, email: str, verification_token: str, user_name: Optional[str] = None) -> bool:
        """Send email verification email"""
        try:
            if not self.api_key:
                print("⚠️  RESEND_API_KEY not configured - email verification disabled")
                return True  # In development, skip email verification
            
            # Create verification URL
            verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
            
            # Email content
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Verify Your ChefBot Account</title>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: white; }}
                    .header {{ background: linear-gradient(135deg, #FF6B6B, #4ECDC4); padding: 40px 20px; text-align: center; }}
                    .header h1 {{ color: white; margin: 0; font-size: 28px; font-weight: 600; }}
                    .header p {{ color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }}
                    .content {{ padding: 40px 30px; }}
                    .content h2 {{ color: #2D3748; margin: 0 0 20px 0; font-size: 24px; }}
                    .content p {{ color: #4A5568; line-height: 1.6; margin: 16px 0; }}
                    .button {{ display: inline-block; background: linear-gradient(135deg, #FF6B6B, #4ECDC4); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }}
                    .button:hover {{ transform: translateY(-2px); }}
                    .footer {{ background-color: #F7FAFC; padding: 30px; text-align: center; border-top: 1px solid #E2E8F0; }}
                    .footer p {{ color: #718096; font-size: 14px; margin: 0; }}
                    .security {{ background-color: #EDF2F7; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                    .security p {{ color: #4A5568; font-size: 14px; margin: 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>👨‍🍳 ChefBot</h1>
                        <p>Your AI Culinary Assistant</p>
                    </div>
                    
                    <div class="content">
                        <h2>Welcome to ChefBot! 🎉</h2>
                        <p>Hi{f" {user_name}" if user_name else ""}! We're excited to have you in the ChefBot family.</p>
                        <p>To start discovering amazing recipes from your photos, click the button below to verify your email address:</p>
                        
                        <div style="text-align: center;">
                            <a href="{verification_url}" class="button">Verify Email ✨</a>
                        </div>
                        
                        <p>Once verified, you'll be able to:</p>
                        <ul style="color: #4A5568; line-height: 1.8;">
                            <li>📸 <strong>Analyze photos</strong> of ingredients</li>
                            <li>🤖 <strong>Get personalized recipes</strong> with AI</li>
                            <li>📊 <strong>Track your usage</strong> in the dashboard</li>
                            <li>⭐ <strong>Unlock PRO features</strong></li>
                        </ul>
                        
                        <div class="security">
                            <p><strong>🔒 Security:</strong> This link expires in 24 hours. If you didn't request this registration, please ignore this email.</p>
                        </div>
                        
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #666;">{verification_url}</p>
                    </div>
                    
                    <div class="footer">
                        <p>ChefBot - The Future of Cooking is Here 👨‍🍳</p>
                        <p>Having trouble? <a href="mailto:support@chefbot.com" style="color: #FF6B6B;">Contact us</a></p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Send email via Resend
            params = {
                "from": "Chef Bot <onboarding@resend.dev>",  # Free Resend domain
                "to": [email],
                "subject": "Verify Your Chef Bot Account 👨‍🍳",
                "html": html_content,
            }
            
            result = resend.Emails.send(params)
            print(f"✅ Verification email sent to {email}: {result}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send verification email to {email}: {str(e)}")
            return False
    
    async def send_password_reset_email(self, email: str, reset_token: str, user_name: Optional[str] = None) -> bool:
        """Send password reset email"""
        try:
            if not self.api_key:
                print("⚠️  RESEND_API_KEY not configured - password reset disabled")
                return True
            
            # Create reset URL
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Reset Your ChefBot Password</title>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: white; }}
                    .header {{ background: linear-gradient(135deg, #FF6B6B, #4ECDC4); padding: 40px 20px; text-align: center; }}
                    .header h1 {{ color: white; margin: 0; font-size: 28px; font-weight: 600; }}
                    .header p {{ color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }}
                    .content {{ padding: 40px 30px; }}
                    .content h2 {{ color: #2D3748; margin: 0 0 20px 0; font-size: 24px; }}
                    .content p {{ color: #4A5568; line-height: 1.6; margin: 16px 0; }}
                    .button {{ display: inline-block; background: linear-gradient(135deg, #FF6B6B, #4ECDC4); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }}
                    .footer {{ background-color: #F7FAFC; padding: 30px; text-align: center; border-top: 1px solid #E2E8F0; }}
                    .footer p {{ color: #718096; font-size: 14px; margin: 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>👨‍🍳 ChefBot</h1>
                        <p>Your AI Culinary Assistant</p>
                    </div>
                    
                    <div class="content">
                        <h2>Password Reset</h2>
                        
                        <p>Hi{f" {user_name}" if user_name else ""}!</p>
                        
                        <p>We received a request to reset your ChefBot account password. Click the button below to create a new password:</p>
                        
                        <div style="text-align: center;">
                            <a href="{reset_url}" class="button">Reset Password 🔑</a>
                        </div>
                        
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #666;">{reset_url}</p>
                        
                        <p><strong>This link will expire in 1 hour.</strong></p>
                        
                        <p>If you didn't request this password reset, you can safely ignore this email. Your password won't be changed.</p>
                    </div>
                    
                    <div class="footer">
                        <p>ChefBot - The Future of Cooking is Here 👨‍🍳</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            params = {
                "from": "Chef Bot <onboarding@resend.dev>",
                "to": [email],
                "subject": "Reset Your Chef Bot Password 🔑",
                "html": html_content,
            }
            
            result = resend.Emails.send(params)
            print(f"✅ Password reset email sent to {email}: {result}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send password reset email to {email}: {str(e)}")
            return False

# Global email service instance
email_service = EmailService()
