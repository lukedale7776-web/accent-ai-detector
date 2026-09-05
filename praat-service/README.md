# Praat / Parselmouth Acoustic Feature Extraction Microservice

FastAPI microservice utilizing `praat-parselmouth` (Python C-bindings for Paul Boersma & David Weenink's Praat) to extract empirical phonetic measurements from speech audio:
- **Pitch ($F_0$) Tracking**: Mean, standard deviation, minimum, and maximum fundamental frequency.
- **Burg Formants ($F_1, F_2, F_3$)**: Accurate vowel height ($F_1$), backness/frontness ($F_2$), and rhoticity suppression indicator ($F_3$).
- **Voice Quality**: Local Jitter (pitch perturbation) and Shimmer (amplitude perturbation).
- **Acoustic Intensity**: Sound pressure level in decibels (mean & std dB).

---

## Local Development

```bash
cd praat-service
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

### Health Check
```bash
curl http://localhost:8001/health
# Returns: {"status":"ok"}
```

### Audio Analysis
```bash
curl -X POST http://localhost:8001/analyze -F "file=@/path/to/sample.wav"
```

---

## Deployment (Docker)

Because Next.js runs in serverless environments on Vercel (where heavy C++ audio libraries cannot run natively), this microservice can be deployed to any Docker container host:

### Option 1: Railway.app
1. Create a new project on [Railway.app](https://railway.app).
2. Connect your GitHub repository.
3. Set the **Root Directory** to `praat-service`.
4. Railway will automatically build the `Dockerfile` and expose a public HTTPS URL (e.g. `https://praat-service-production.up.railway.app`).
5. In your Vercel Dashboard, set the environment variable:
   ```env
   PRAAT_SERVICE_URL=https://praat-service-production.up.railway.app
   ```

### Option 2: Render.com
1. Create a **New Web Service** on [Render.com](https://render.com).
2. Point to the repository with root directory `praat-service`.
3. Choose **Docker** runtime.
4. Copy the assigned URL and add `PRAAT_SERVICE_URL` to Vercel.

### Option 3: Fly.io
```bash
cd praat-service
fly launch
fly deploy
```
