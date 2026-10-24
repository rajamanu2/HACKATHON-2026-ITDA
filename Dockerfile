FROM node:24-bookworm-slim AS node_runtime
FROM python:3.12-slim-bookworm
COPY --from=node_runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=node_runtime /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
 && apt-get update && apt-get install -y --no-install-recommends ca-certificates libstdc++6 libgomp1 build-essential git \
 && rm -rf /var/lib/apt/lists/* \
 && python -m venv /opt/ai \
 && /opt/ai/bin/pip install --no-cache-dir 'torch==2.14.1+cpu' 'torchvision==0.29.1+cpu' 'pillow==12.3.0' --index-url https://download.pytorch.org/whl/cpu \
 && npm install --prefix /opt/n8n-runtime n8n@2.44.6 --omit=dev --no-audit --no-fund \
 && groupadd --gid 1000 care && useradd --uid 1000 --gid care --create-home care
WORKDIR /app
COPY --chown=care:care package.json server.mjs ./
COPY --chown=care:care src ./src
COPY --chown=care:care public ./public
COPY --chown=care:care scripts ./scripts
COPY --chown=care:care n8n ./n8n
COPY --chown=care:care cloud ./cloud
COPY --chown=care:care cloud/releases ./dist/android
RUN mkdir -p /app/.local && chown care:care /app/.local
ENV HOST=0.0.0.0 PORT=4173 COOKIE_SECURE=true DATA_DIR=/app/.local \
    N8N_RUNTIME_DIR=/opt/n8n-runtime N8N_LISTEN_ADDRESS=0.0.0.0 \
    DRISHTI_AI_PYTHON=/opt/ai/bin/python ENABLE_RESEARCH_AI=true \
    ANDROID_APK_PATH=/app/dist/android/Aarogya-Drishti-cloud.apk
USER care
EXPOSE 4173
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "cloud/start.mjs"]
