FROM node:22

# Install necessary dependencies for Puppeteer and Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    apt-transport-https \
    chromium \
    chromium-driver \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"
ENV CHROME_BIN=/usr/bin/chromium


WORKDIR /app
COPY package*.json ./
COPY ./public ./public
COPY ./src ./src
COPY ./docker ./config
COPY vite.config.ts .
COPY tsconfig.json .
COPY jvThumbs.csv .

RUN npm install
RUN npm run build

RUN mkdir -p ./config/db

EXPOSE 3000

CMD ["npm", "start"]
