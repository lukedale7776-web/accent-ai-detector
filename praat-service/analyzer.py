import parselmouth
from parselmouth.praat import call
import numpy as np

def analyze_audio(file_path: str) -> dict:
    snd = parselmouth.Sound(file_path)

    # Pitch analysis
    pitch = snd.to_pitch()
    pitch_values = pitch.selected_array['frequency']
    pitch_values = pitch_values[pitch_values != 0]  # remove unvoiced

    # Formants
    formant = snd.to_formant_burg()
    duration = snd.get_total_duration()

    f1_values, f2_values, f3_values = [], [], []
    time_step = 0.01
    t = 0
    while t < duration:
        f1 = call(formant, "Get value at time", 1, t, 'Hertz', 'Linear')
        f2 = call(formant, "Get value at time", 2, t, 'Hertz', 'Linear')
        f3 = call(formant, "Get value at time", 3, t, 'Hertz', 'Linear')
        if not np.isnan(f1): f1_values.append(f1)
        if not np.isnan(f2): f2_values.append(f2)
        if not np.isnan(f3): f3_values.append(f3)
        t += time_step

    # Jitter and shimmer (voice quality)
    # Acoustic phonetics standard: minimum ~1.5s duration and sufficient voiced frames (>20)
    # to avoid artifactual noise on short clips (Baken & Orlikoff, 2000; Boersma, 2001)
    jitter = None
    shimmer = None
    voice_quality_reliable = bool(duration >= 1.5 and len(pitch_values) >= 20)

    if voice_quality_reliable:
        try:
            point_process = call(snd, "To PointProcess (periodic, cc)", 75, 500)
            raw_jitter = call(point_process, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3)
            raw_shimmer = call([snd, point_process], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
            # Filter NaN and physiological outlier limits (clipping / background noise)
            if not np.isnan(raw_jitter) and 0.0 <= raw_jitter <= 0.20:
                jitter = float(raw_jitter)
            if not np.isnan(raw_shimmer) and 0.0 <= raw_shimmer <= 0.40:
                shimmer = float(raw_shimmer)
        except Exception:
            jitter = None
            shimmer = None
            voice_quality_reliable = False

    # Intensity
    intensity = snd.to_intensity()
    intensity_values = intensity.values.flatten()
    intensity_values = intensity_values[~np.isnan(intensity_values)]

    return {
        "duration_sec": float(duration),
        "pitch": {
            "mean_hz": float(np.mean(pitch_values)) if len(pitch_values) else None,
            "std_hz": float(np.std(pitch_values)) if len(pitch_values) else None,
            "min_hz": float(np.min(pitch_values)) if len(pitch_values) else None,
            "max_hz": float(np.max(pitch_values)) if len(pitch_values) else None,
        },
        "formants": {
            "f1_mean": float(np.mean(f1_values)) if f1_values else None,
            "f2_mean": float(np.mean(f2_values)) if f2_values else None,
            "f3_mean": float(np.mean(f3_values)) if f3_values else None,
        },
        "voice_quality": {
            "jitter_local": jitter,
            "shimmer_local": shimmer,
            "reliable": voice_quality_reliable,
        },
        "intensity": {
            "mean_db": float(np.mean(intensity_values)) if len(intensity_values) else None,
            "std_db": float(np.std(intensity_values)) if len(intensity_values) else None,
        }
    }
