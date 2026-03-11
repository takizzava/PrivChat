FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=development

RUN apk add --no-cache bash

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

CMD ["./entrypoint.sh"]
