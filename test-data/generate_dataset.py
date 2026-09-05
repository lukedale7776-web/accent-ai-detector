import json
import os
import subprocess

AUDIO_DIR = "test-data/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

samples = [
    # --- UNITED KINGDOM ---
    {
        "id": "sample_001.wav",
        "voice": "Daniel",
        "gender": "M",
        "accent": "United Kingdom",
        "region": "Standard Southern British (RP)",
        "text": "Right, brilliant. Let us queue up and grab a proper biscuit and a cup of tea before the train departs from Waterloo."
    },
    {
        "id": "sample_002.wav",
        "voice": "Flo (English (UK))",
        "gender": "F",
        "accent": "United Kingdom",
        "region": "Modern RP / Southern British",
        "text": "Honestly that was rather splendid, I fancy we ought to stroll down to the market and fetch some fresh scones."
    },
    {
        "id": "sample_003.wav",
        "voice": "Rocko (English (UK))",
        "gender": "M",
        "accent": "United Kingdom",
        "region": "Estuary / London",
        "text": "Look mate, I ain't got a clue what you're talking about, but it's totally wicked innit, let's sort it out now."
    },
    {
        "id": "sample_004.wav",
        "voice": "Shelley (English (UK))",
        "gender": "F",
        "accent": "United Kingdom",
        "region": "British English",
        "text": "Mind the gap please, we are heading towards Piccadilly and the weather forecast said it would drizzle this afternoon."
    },
    {
        "id": "sample_005.wav",
        "voice": "Sandy (English (UK))",
        "gender": "F",
        "accent": "United Kingdom",
        "region": "Scottish / Northern British",
        "text": "Aye, it's a braw bricht moonlicht nicht tonight, we can walk up the glen and see the loch before dark."
    },

    # --- UNITED STATES ---
    {
        "id": "sample_006.wav",
        "voice": "Fred",
        "gender": "M",
        "accent": "United States",
        "region": "General American",
        "text": "Hey everyone, I am heading over to the gas station to grab some chips and soda for the game tonight."
    },
    {
        "id": "sample_007.wav",
        "voice": "Samantha",
        "gender": "F",
        "accent": "United States",
        "region": "General American",
        "text": "We need to finish this presentation by four o'clock so our team can review the quarterly revenue report."
    },
    {
        "id": "sample_008.wav",
        "voice": "Ralph",
        "gender": "M",
        "accent": "United States",
        "region": "Southern US",
        "text": "Well now y'all, we're fixin' to fry up some catfish and hushpuppies down by the porch this evening."
    },
    {
        "id": "sample_009.wav",
        "voice": "Kathy",
        "gender": "F",
        "accent": "United States",
        "region": "Midwestern American",
        "text": "Oh doncha know, it's pretty cold out on the lake today, let me grab my sweater from the back of the car."
    },
    {
        "id": "sample_010.wav",
        "voice": "Eddy (English (US))",
        "gender": "M",
        "accent": "United States",
        "region": "Standard American",
        "text": "The highway traffic was pretty backed up near downtown, but navigation routed us through the side streets."
    },

    # --- IRELAND ---
    {
        "id": "sample_011.wav",
        "voice": "Moira",
        "gender": "F",
        "accent": "Ireland",
        "region": "Hiberno-English (Dublin)",
        "text": "What's the craic lads? That was grand altogether, proper sound and deadly banter down in the pub."
    },
    {
        "id": "sample_012.wav",
        "voice": "Moira",
        "gender": "F",
        "accent": "Ireland",
        "region": "Irish English",
        "text": "I'm telling you boy, the rain was pouring down in buckets, but we had ourselves a lovely warm stew anyway."
    },

    # --- AUSTRALIA ---
    {
        "id": "sample_013.wav",
        "voice": "Karen",
        "gender": "F",
        "accent": "Australia",
        "region": "General Australian",
        "text": "G'day mate! Grab a cold tinny from the esky this arvo, no worries, we will chuck some snags on the barbie."
    },
    {
        "id": "sample_014.wav",
        "voice": "Karen",
        "gender": "F",
        "accent": "Australia",
        "region": "Broad Australian",
        "text": "Fair dinkum mate, that bloke was flat out like a lizard drinking, we reckon he needs a proper holiday."
    },

    # --- SOUTH AFRICA ---
    {
        "id": "sample_015.wav",
        "voice": "Tessa",
        "gender": "F",
        "accent": "South Africa",
        "region": "South African English",
        "text": "Howzit boet! Let's fire up the braai now-now, it's going to be lekker having biltong with our mates."
    },
    {
        "id": "sample_016.wav",
        "voice": "Tessa",
        "gender": "F",
        "accent": "South Africa",
        "region": "South African English",
        "text": "We were stuck at the robot for twenty minutes while the minibus taxi was passing by, eish what a day."
    },

    # --- INDIA ---
    {
        "id": "sample_017.wav",
        "voice": "Aman (English (India))",
        "gender": "M",
        "accent": "India",
        "region": "Indian English (Hindi Substrate)",
        "text": "Kindly do the needful and revert back at the earliest. We will prepone the meeting so there is no confusion."
    },
    {
        "id": "sample_018.wav",
        "voice": "Tara",
        "gender": "F",
        "accent": "India",
        "region": "Indian English",
        "text": "Please pass me that file only, I have already updated all the details in the system yesterday itself."
    },
    {
        "id": "sample_019.wav",
        "voice": "Rishi",
        "gender": "M",
        "accent": "India",
        "region": "Indian English",
        "text": "Today itself we are completing the entire deliverables, no tension at all, everything is in proper track."
    },

    # --- FRANCE ---
    {
        "id": "sample_020.wav",
        "voice": "Thomas",
        "gender": "M",
        "accent": "France",
        "region": "French Substrate English",
        "text": "Bonjour! I think this restaurant has very good croissant and baguette, we should order a cafe au lait."
    },
    {
        "id": "sample_021.wav",
        "voice": "Audrey",
        "gender": "F",
        "accent": "France",
        "region": "French Substrate English",
        "text": "Excuse me, could you tell me where is the Louvre museum? We have a reservation for this afternoon."
    },

    # --- GERMANY ---
    {
        "id": "sample_022.wav",
        "voice": "Anna",
        "gender": "F",
        "accent": "Germany",
        "region": "German Substrate English",
        "text": "Guten Tag! Everything is organized strictly according to the schedule and the technical specifications."
    },
    {
        "id": "sample_023.wav",
        "voice": "Eddy (German (Germany))",
        "gender": "M",
        "accent": "Germany",
        "region": "German Substrate English",
        "text": "We must verify the engineering tolerances very carefully before starting the manufacturing process."
    },

    # --- SPAIN ---
    {
        "id": "sample_024.wav",
        "voice": "Mónica",
        "gender": "F",
        "accent": "Spain",
        "region": "Spanish Substrate English",
        "text": "Hola! Let us go to the plaza to eat some delicious tapas and paella with our good friends tonight."
    },
    {
        "id": "sample_025.wav",
        "voice": "Jorge",
        "gender": "M",
        "accent": "Spain",
        "region": "Spanish Substrate English",
        "text": "The football match yesterday was incredible, our team played with great passion until the final minute."
    },

    # --- JAPAN ---
    {
        "id": "sample_026.wav",
        "voice": "Kyoko",
        "gender": "F",
        "accent": "Japan",
        "region": "Japanese Substrate English",
        "text": "Hello, thank you very much for your kind support. We will prepare the bullet train tickets for Tokyo."
    },
    {
        "id": "sample_027.wav",
        "voice": "Eddy (Japanese (Japan))",
        "gender": "M",
        "accent": "Japan",
        "region": "Japanese Substrate English",
        "text": "Good morning, our team has arrived at the convention center and we are ready for the presentation."
    },

    # --- BRAZIL ---
    {
        "id": "sample_028.wav",
        "voice": "Luciana",
        "gender": "F",
        "accent": "Brazil",
        "region": "Brazilian Portuguese Substrate",
        "text": "Hello! We love to celebrate on the beach in Rio de Janeiro with wonderful samba music and carnival."
    },
    {
        "id": "sample_029.wav",
        "voice": "Eddy (Portuguese (Brazil))",
        "gender": "M",
        "accent": "Brazil",
        "region": "Brazilian Portuguese Substrate",
        "text": "The atmosphere at the stadium was unbelievable, everyone was dancing and cheering for our national team."
    },

    # --- ITALY ---
    {
        "id": "sample_030.wav",
        "voice": "Alice",
        "gender": "F",
        "accent": "Italy",
        "region": "Italian Substrate English",
        "text": "Ciao! We are making fresh handmade pasta and authentic espresso for the family dinner this evening."
    }
]

manifest = []
for s in samples:
    wav_path = os.path.join(AUDIO_DIR, s["id"])
    aiff_path = wav_path.replace(".wav", ".aiff")
    print(f"Generating {s['id']} [{s['accent']} - {s['gender']}] using voice '{s['voice']}'...")
    
    cmd = f'say -v "{s["voice"]}" "{s["text"]}" -o "{aiff_path}" && afconvert -f WAVE -d LEI16@16000 "{aiff_path}" "{wav_path}" && rm -f "{aiff_path}"'
    res = subprocess.run(cmd, shell=True)
    if res.returncode != 0 or not os.path.exists(wav_path):
        print(f"ERROR: Failed to generate {s['id']}")
        continue

    manifest.append({
        "file": s["id"],
        "true_accent": s["accent"],
        "true_region": s["region"],
        "speaker_gender": s["gender"],
        "sample_text": s["text"]
    })

manifest_path = "test-data/manifest.json"
with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"\nSuccessfully generated {len(manifest)} benchmark samples in {AUDIO_DIR}/")
print(f"Saved ground truth manifest to {manifest_path}")
