FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y ffmpeg python3 python3-pip fonts-noto fonts-noto-cjk fonts-liberation && rm -rf /var/lib/apt/lists/*
RUN pip3 install --break-system-packages faster-whisper opencv-python-headless
WORKDIR /app
COPY . .
RUN npm install --omit=dev
ENV PORT=7860
EXPOSE 7860
CMD ["node","server.js"]
