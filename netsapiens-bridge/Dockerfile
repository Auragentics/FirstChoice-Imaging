# FCI Net Sapiens bridge — Cloud Run image.
FROM node:22-slim

WORKDIR /app

# Install runtime deps (nodemailer) reproducibly from the lockfile.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the source (no .env, no tests, no docs — see .dockerignore).
COPY src ./src

ENV NODE_ENV=production

# Run as the built-in non-root user.
USER node

# Cloud Run injects PORT (default 8080); server.js reads process.env.PORT.
CMD ["node", "src/server.js"]
