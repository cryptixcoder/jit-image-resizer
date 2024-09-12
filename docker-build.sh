#!/bin/bash

# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Build the Docker image
docker build \
    --build-arg AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
    --build-arg AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    --build-arg AWS_REGION=$AWS_REGION \
    --build-arg AWS_ENDPOINT=$AWS_ENDPOINT \
    --build-arg AWS_BUCKET=$AWS_BUCKET \
    --build-arg REDIS_HOST=$REDIS_HOST \
    -t jit-image-resizer:latest .
