from fastapi import APIRouter, HTTPException
from app.crud.mailgun import send_simple_message

router = APIRouter(prefix="/mailgun", tags=["mailgun"])



@router.post("/send-email/")
def send_email(to_email: str, subject: str, message: str):
    """
    Send an email using Mailgun.
    Expects:
      - to_email: Recipient email address
      - subject: Email subject
      - message: Email content (plain text)
    """
    response = send_simple_message(to_email, subject, message)
    response_json = response.json()

    if "id" in response_json:
        return {"message": "Email sent successfully!", "id": response_json.get("id")}

    raise HTTPException(status_code=400, detail=response_json)
