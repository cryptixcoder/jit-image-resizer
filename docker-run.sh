#!/bin/bash

# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

docker run -p 3000:3000 \
    -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
    -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    -e AWS_REGION=$AWS_REGION \
    -e AWS_ENDPOINT=$AWS_ENDPOINT \
    -e AWS_BUCKET=$AWS_BUCKET \
    -e REDIS_HOST=$REDIS_HOST \
    -d jit-image-resizer:latest
