from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import tempfile
import os
from analyzer import analyze_audio

app = FastAPI(title="Praat Phonetics Microservice")

# Configurable CORS: default to local frontend ports and production deployment
default_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3005",
    "https://accent-ai-detector.vercel.app",
]
env_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
allowed_origins = env_origins if env_origins else default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    filename = (file.filename or "audio.wav").lower()
    if not filename.endswith((".wav", ".mp3", ".m4a", ".flac", ".ogg", ".webm")):
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    ext = os.path.splitext(filename)[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = analyze_audio(tmp_path)
        return {"success": True, "features": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Praat acoustic extraction error: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

@app.get("/health")
async def health():
    return {"status": "ok"}
