import os
import resend
from dotenv import load_dotenv

load_dotenv()

# Set up Resend API core key
resend.api_key = os.getenv("RESEND_API_KEY")

# 🌟 Dynamic Sender Configuration with Smart Fallbacks
MAIL_FROM_ADDRESS = os.getenv("MAIL_FROM_ADDRESS", "onboarding@resend.dev")
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "Aurum & Co.")
SENDER_IDENTITY = f"{MAIL_FROM_NAME} <{MAIL_FROM_ADDRESS}>"


def send_order_email(customer_email: str, customer_name: str, order_id: int, status: str, total: float):
    if not resend.api_key:
        print("Resend API key not configured. Skipping email.")
        return

    subject_map = {
        "pending_payment": f"Aurum & Co. - Order #{order_id} Confirmed",
        "processing": f"Aurum & Co. - Payment Received for Order #{order_id}",
        "shipped": f"Aurum & Co. - Order #{order_id} is on its way",
        "delivered": f"Aurum & Co. - Order #{order_id} Delivered",
        "cancelled": f"Aurum & Co. - Order #{order_id} Cancelled"
    }

    message_map = {
        "pending_payment": "Thank you for your order. We have successfully received it. Please proceed to WhatsApp to complete your secure payment.",
        "pending_confirmation" : "We have received your payment transaction details! Our administration desk is currently verifying the transaction. You will receive an update as soon as the payment clears.",
        "processing": "We have successfully confirmed your payment. Our artisans are currently preparing your luxury pieces for dispatch.",
        "shipped": "Your collection has been dispatched and is currently en route to your shipping address.",
        "delivered": "Your order has been marked as delivered. We hope you enjoy your new pieces from Aurum & Co.",
        "cancelled": "Your order has been cancelled. If you believe this was a mistake, please reach out to our concierge team."
    }

    subject = subject_map.get(status, f"Aurum & Co. - Order #{order_id} Update")
    body_text = message_map.get(status, "Your order status has been updated.")

    html_content = f"""
    <html>
      <body style="font-family: 'Georgia', serif; background-color: #f9fafb; margin: 0; padding: 40px 0;">
        <div style="max-w: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; padding: 40px; text-align: center;">
          <h1 style="text-transform: uppercase; letter-spacing: 4px; color: #111827; font-size: 24px; margin-bottom: 10px;">Aurum & Co.</h1>
          <div style="height: 1px; background-color: #d97706; width: 40px; margin: 0 auto 30px;"></div>
          
          <h2 style="font-size: 16px; color: #374151; letter-spacing: 2px; text-transform: uppercase;">Order #{order_id}</h2>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.8; margin-bottom: 30px;">
            Dear {customer_name},<br><br>
            {body_text}
          </p>
          
          <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 20px; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #92400e;">
              <strong>Order Total:</strong> ${total:.2f}
            </p>
          </div>
          
          <p style="font-size: 11px; color: #9ca3af; letter-spacing: 1px; text-transform: uppercase;">
            Aurum & Co. Luxury Fine Jewelry<br>
            Do not reply to this automated message.
          </p>
        </div>
      </body>
    </html>
    """

    try:
        params = {
            "from": SENDER_IDENTITY, # 🌟 Now dynamically populated
            "to": [customer_email],
            "subject": subject,
            "html": html_content,
        }
        
        email_response = resend.Emails.send(params)
        print(f"Resend order email sent successfully! ID: {email_response['id']}")
        
    except Exception as e:
        print(f"Failed to send email via Resend: {e}")


def send_welcome_email(customer_email: str, first_name: str):
    if not resend.api_key:
        print("Resend API key not configured. Skipping welcome email.")
        return

    subject = "Welcome to the Inner Circle | Aurum & Co."

    html_content = f"""
    <html>
      <body style="font-family: 'Georgia', serif; background-color: #f9fafb; margin: 0; padding: 40px 0;">
        <div style="max-w: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; padding: 40px; text-align: center;">
          <h1 style="text-transform: uppercase; letter-spacing: 4px; color: #111827; font-size: 24px; margin-bottom: 10px;">Aurum & Co.</h1>
          <div style="height: 1px; background-color: #d97706; width: 40px; margin: 0 auto 30px;"></div>
          
          <h2 style="font-size: 16px; color: #374151; letter-spacing: 2px; text-transform: uppercase;">The Inner Circle</h2>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.8; margin-bottom: 30px;">
            Dear {first_name},<br><br>
            It is our absolute pleasure to welcome you to Aurum & Co. Your account has been successfully created.<br><br>
            As a member of our Inner Circle, you now have exclusive access to our curated collections of fine jewelry and luxury timepieces. 
          </p>
          
          <div style="margin-bottom: 40px;">
            <a href="https://aurum-store.vercel.app/catalog" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">
              Explore The Collection
            </a>
          </div>
          
          <p style="font-size: 11px; color: #9ca3af; letter-spacing: 1px; text-transform: uppercase;">
            Aurum & Co. Luxury Fine Jewelry<br>
            Do not reply to this automated message.
          </p>
        </div>
      </body>
    </html>
    """

    try:
        params = {
            "from": SENDER_IDENTITY, # 🌟 Now dynamically populated
            "to": [customer_email],
            "subject": subject,
            "html": html_content,
        }
        
        email_response = resend.Emails.send(params)
        print(f"Welcome email sent successfully! ID: {email_response['id']}")
        
    except Exception as e:
        print(f"Failed to send welcome email via Resend: {e}")