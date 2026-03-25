import os
import time
from collections import defaultdict, deque
from threading import Lock
from typing import Deque
from fastapi import FastAPI, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from dotenv import load_dotenv
from jose import JWTError, jwt
from langchain_core.messages import HumanMessage
from api import schemas
from Agent.agent import app as agent_graph

# Import your utility functions
from api.auth_utils import verify_password, create_access_token, SECRET_KEY, ALGORITHM

load_dotenv()

app = FastAPI(title="FinShield API", description="Backend for AI Fraud Detection System")


class AgentExecutionError(Exception):
    def __init__(self, message: str, details: list[str] | None = None):
        self.message = message
        self.details = details or []
        super().__init__(message)


def _parse_cors_origins(value: str) -> list[str]:
    return [origin.strip() for origin in value.split(",") if origin.strip()]


cors_origins = _parse_cors_origins(os.getenv("CORS_ALLOWED_ORIGINS", "*")) or ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic in-memory sliding-window rate limiter (per client IP and route).
RATE_LIMIT_MAX_REQUESTS = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "60"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
_rate_limit_store: dict[str, Deque[float]] = defaultdict(deque)
_rate_limit_lock = Lock()


def _rate_limit_key(request: Request) -> str:
    client_ip = request.client.host if request.client else "unknown"
    return f"{client_ip}:{request.url.path}"


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    key = _rate_limit_key(request)
    now = time.time()

    with _rate_limit_lock:
        bucket = _rate_limit_store[key]
        window_start = now - RATE_LIMIT_WINDOW_SECONDS
        while bucket and bucket[0] < window_start:
            bucket.popleft()

        if len(bucket) >= RATE_LIMIT_MAX_REQUESTS:
            retry_after = max(1, int(bucket[0] + RATE_LIMIT_WINDOW_SECONDS - now))
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many requests. Please try again later.",
                    },
                    "meta": {"retry_after_seconds": retry_after},
                },
                headers={"Retry-After": str(retry_after)},
            )

        bucket.append(now)

    return await call_next(request)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    message = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": message,
            },
        },
        headers=exc.headers,
    )


@app.exception_handler(AgentExecutionError)
async def agent_exception_handler(_: Request, exc: AgentExecutionError):
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={
            "success": False,
            "error": {
                "code": "AGENT_EXECUTION_FAILED",
                "message": exc.message,
                "details": exc.details,
            },
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, __: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Unexpected server error",
            },
        },
    )

# Initialize Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# This tells FastAPI where to look for the token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def decode_bearer_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str | None = payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


@app.get("/")
async def root():
    return {
        "service": "FinShield API",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/favicon.ico")
async def favicon():
    # Return empty response to avoid noisy browser 404 logs.
    return Response(status_code=204)

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login endpoint. 
    In 'username' field, user should provide their Phone Number.
    """
    # 1. Look up user by phone in the 'users' table
    query = supabase.table("users").select("*").eq("phone", form_data.username).execute()
    user = query.data[0] if query.data else None

    # 2. Validate user existence and password
    if not user or not verify_password(form_data.password, user.get("hashed_password")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Create the JWT Token
    # We store the phone (sub) and the user_id in the payload
    access_token = create_access_token(
        data={"sub": user["phone"], "user_id": user["user_id"]}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/v1/verify-session")
async def verify_session(token: str = Depends(oauth2_scheme)):
    """
    A protected route. If the token is invalid/expired, 
    FastAPI will automatically return 401 Unauthorized.
    """
    return {
        "status": "authenticated",
        "message": "Token is valid. Welcome to FinShield."
    }


@app.get("/users/me", response_model=schemas.UserOut)
async def get_my_profile(token: str = Depends(oauth2_scheme)):
    payload = decode_bearer_token(token)
    user_id: str = payload["user_id"]

    # Fetch only public profile fields defined in UserOut.
    query = (
        supabase.table("users")
        .select("user_id,name,phone,balance,risk_score,is_verified,last_active")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    user = query.data[0] if query.data else None

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


@app.post("/chat", response_model=schemas.ChatResponse)
async def chat_with_agent(body: schemas.ChatRequest, token: str = Depends(oauth2_scheme)):
    payload = decode_bearer_token(token)
    user_id: str = payload["user_id"]

    prompt = f"Authenticated user_id: {user_id}. User query: {body.message}"
    inputs = {"messages": [HumanMessage(content=prompt)]}

    final_reply = ""
    tool_errors: list[str] = []
    try:
        for event in agent_graph.stream(inputs, stream_mode="values"):
            if "messages" not in event or not event["messages"]:
                continue

            last_msg = event["messages"][-1]
            msg_type = getattr(last_msg, "type", None)
            msg_content = str(getattr(last_msg, "content", ""))

            if msg_type == "tool":
                lowered = msg_content.lower()
                if "error:" in lowered or "database error" in lowered or "graph error" in lowered:
                    tool_errors.append(msg_content)

            if getattr(last_msg, "type", None) == "ai" and getattr(last_msg, "content", None):
                final_reply = msg_content
    except Exception as exc:
        raise AgentExecutionError("Agent execution failed", [str(exc)]) from exc

    if tool_errors:
        raise AgentExecutionError(
            "AI tool failure during processing",
            details=tool_errors[:3],
        )

    if not final_reply:
        raise AgentExecutionError("Agent returned an empty response")

    return {"reply": final_reply, "user_id": user_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)