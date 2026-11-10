# TGR CLIPS AI
Self-hosted AI video clipper. All processing is local (FFmpeg + faster-whisper + OpenCV). No accounts, credits or locked features.

## Run
Requirements: Node 18+, FFmpeg, Python 3.9+.
```
pip install faster-whisper opencv-python-headless     # speech recognition + speaker tracking
npm install && npm start                               # http://localhost:3000
```
First analysis downloads the Whisper model (~500 MB for `small`). Env vars: `WHISPER_MODEL` (tiny/base/small/medium/large-v3), `PORT`, `FFMPEG`, `PYTHON`.
Install fonts for Arabic/CJK/Bengali/Punjabi captions (e.g. `fonts-noto`, `fonts-noto-cjk`) and pick a Noto font in Caption Studio.
The browser loads React/Tailwind from CDNs, so the UI needs internet on first load.

## Honest notes
- Free = your own hardware. CPU transcription runs ~1-3x real time on `small`; a GPU is much faster. Long videos need disk + patience.
- Moment detection is heuristic (speech density, hook words, questions, pauses), not a trained virality model.
- Speaker tracking = per-clip face-aware crop (median face position), not frame-by-frame following.
- Roman Urdu / Roman Hindi: Whisper is prompted to write Latin letters; quality is best-effort, so fix words in the transcript editor before export.
- Whisper accuracy varies by language (Urdu/Punjabi/Bengali weaker); use `medium` or `large-v3` if you can.

## Free deployment
Needs a host that can run FFmpeg/Python and keep files (NOT Vercel/Netlify serverless).
- **Hugging Face Spaces (Docker SDK, free CPU)**: push this folder, Dockerfile listens on 7860. Storage is ephemeral; free CPU is slow.
- **Oracle Cloud Always Free (ARM VM)**: `docker build -t tgr . && docker run -p 80:7860 -v $PWD/data:/app/data tgr`.
- **Your own PC/server** + Cloudflare Tunnel for a free public URL.
Free tiers sleep/limit CPU and storage; add auth before exposing publicly, since uploads are open.
