FROM node:22-alpine

# Install necessary dependencies for Puppeteer and Chromium
RUN apk update && apk add --no-cache \
        alsa-lib \
        cairo \
        cups-libs \
        dbus-libs \
        eudev-libs \
        expat \
        flac \
        gdk-pixbuf \
        glib \
        libgcc \
        libjpeg-turbo \
        libpng \
        libwebp \
        libx11 \
        libxcomposite \
        libxdamage \
        libxext \
        libxfixes \
        tzdata \
        libexif \
        udev \
        xvfb \
        zlib-dev \
        chromium \
        chromium-chromedriver \
    && rm -rf /var/cache/apk/*

ENV CHROME_BIN=/usr/bin/chromedriver

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
