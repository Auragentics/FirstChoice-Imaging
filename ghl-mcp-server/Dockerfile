FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY . .

# Install dev deps for build, then remove them
RUN npm install && npm run build && npm prune --production

EXPOSE 8080

CMD ["node", "dist/index.js"]
