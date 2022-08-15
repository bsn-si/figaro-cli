FROM node:17.4-alpine3.14 AS builder
ENV PYTHONUNBUFFERED=1

WORKDIR /cli
RUN apk add --update git alpine-sdk python3 && ln -sf python3 /usr/bin/python
RUN apk add --no-cache --virtual .build-deps make gcc g++
COPY package*.json ./
RUN yarn --check-files
RUN apk del .build-deps
COPY . .
RUN yarn build
ENTRYPOINT [ "node", "dist/index.js" ]
