import json
import os
import requests
import time

MANIFEST_PATH = "test-data/manifest.json"
AUDIO_DIR = "test-data/audio"
API_URL = os.getenv("API_URL", "http://localhost:3005/api/analyze")
RESULTS_PATH = "eval/results.json"
ADMIN_KEY = os.getenv("ADMIN_KEY", "accent-admin-supersecret-2025")

def run_eval():
    if not os.path.exists(MANIFEST_PATH):
        print(f"Error: Manifest not found at {MANIFEST_PATH}")
        return

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    print(f"Starting blind evaluation against {API_URL}...")
    print(f"Loaded {len(manifest)} test samples from {MANIFEST_PATH}\n")

    results = []
    headers = {"x-admin-key": ADMIN_KEY}

    for idx, item in enumerate(manifest, 1):
        file_path = os.path.join(AUDIO_DIR, item["file"])
        if not os.path.exists(file_path):
            print(f"[{idx}/{len(manifest)}] MISSING FILE: {file_path}")
            continue

        try:
            with open(file_path, "rb") as audio_file:
                files = {"file": (item["file"], audio_file, "audio/wav")}
                resp = requests.post(API_URL, files=files, headers=headers, timeout=45)

            if resp.status_code != 200:
                print(f"[{idx}/{len(manifest)}] FAILED: {item['file']} -> HTTP {resp.status_code} ({resp.text[:80]})")
                continue

            data = resp.json()
            pred_accent = data.get("predicted_accent") or data.get("primaryCountry")
            pred_subregion = data.get("predicted_subregion") or data.get("regionOrDialect")

            results.append({
                "file": item["file"],
                "true_accent": item["true_accent"],
                "true_region": item["true_region"],
                "speaker_gender": item.get("speaker_gender"),
                "predicted_accent": pred_accent,
                "predicted_subregion": pred_subregion,
                "confidence_score": data.get("confidenceScore"),
                "praat_features": data.get("praat") or data.get("features"),
                "engine_telemetry": data.get("engineTelemetry")
            })

            marker = "✓" if pred_accent == item["true_accent"] else "✗"
            print(f"[{idx:>2}/{len(manifest)}] {marker} {item['file']}: true='{item['true_accent']}' ({item['true_region']}) | pred='{pred_accent}' ({pred_subregion})")

        except Exception as e:
            print(f"[{idx}/{len(manifest)}] EXCEPTION on {item['file']}: {e}")

        time.sleep(0.5)  # slight pause between calls

    os.makedirs(os.path.dirname(RESULTS_PATH), exist_ok=True)
    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"\nCompleted evaluation! Saved {len(results)}/{len(manifest)} results to {RESULTS_PATH}")

if __name__ == "__main__":
    run_eval()
