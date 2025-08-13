import os
import jwt
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

def get_jwt_secret() -> str:
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        raise ValueError("SUPABASE_JWT_SECRET is not set")
    return secret

def get_user_id_from_token(token: str) -> str:
    try:
        payload = jwt.decode(
            token, 
            get_jwt_secret(), 
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload["sub"]
    except Exception as e:
        print("JWT decode error:", str(e)) 
        raise HTTPException(status_code=401, detail="Invalid token")
