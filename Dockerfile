FROM node:14

RUN apt-get update && \
    apt-get install -y redis-server

ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_REGION
ARG AWS_BUCKET
ARG AWS_ENDPOINT
ARG REDIS_HOST

ENV AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
ENV AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
ENV AWS_REGION="${AWS_REGION}"
ENV AWS_BUCKET="${AWS_BUCKET}"
ENV AWS_ENDPOINT="${AWS_ENDPOINT}"
ENV REDIS_HOST="${REDIS_HOST}"

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

RUN echo '#!/bin/sh \n\
redis-server --daemonize yes && \n\
npm start' > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]