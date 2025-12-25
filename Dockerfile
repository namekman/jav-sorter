FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
COPY ./public ./public
COPY ./src ./src
COPY ./docker ./confi
COPY vite.config.ts .
COPY tsconfig.json .
COPY jvThumbs.csv .

RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
