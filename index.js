const express = require('express');
const sharp = require('sharp')
const AWS = require('aws-sdk')
const crypto = require('crypto');
const redis = require('redis');
const mime = require('mime-types');
const PORT = process.env.PORT || 3000;

const app = express();

// Setup AWS S3 Configs
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT
});

// Setup Redis Client
const client = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:6379`
});

// Connect to Redis
(async () => {
    client.on('error', (err) => console.error('Redis error:', err));
    await client.connect();
})();

// Create helper method to create a key for cache object
const generateCacheKey = (filename, width, height, format) => {
    return crypto.createHash('md5').update(`${filename}_${width}_${height}_${format}`).digest('hex');
};

// Create helper method to get image from S3/Spaces
const getImageFromS3 = async (filename) => {
    const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: filename,
    }

    return await s3.getObject(params).promise();
}

// Helper method to handle resizing image
const resizeImage = async (buffer, width, height, format) => {
    let image = sharp(buffer).resize(parseInt(width), parseInt(height));

    switch(format) {
        case 'jpeg':
        case 'jpg':
            image = image.jpeg();
            break;
        case 'png':
            image = image.png();
            break;
        case'webp':
            image = image.webp();
            break;
        default:
            image = image.jpeg();
            break;
    }

    return await image.toBuffer();
}

app.get('/:filename', async (req, res) => {
    const { filename } = req.params;
    const { width, height } = req.query;

    if(!width || !height) {
        return res.status(400).send('Width and height params are required');
    }

    // Get extension from filename
    const ext = mime.extension(mime.lookup(filename));
    const format = ext || 'jpeg';
    
    const cacheKey = generateCacheKey(filename, width, height, ext);
    const cachedImage = await client.get(cacheKey);

    // If cache of image exist go ahead and send it
    if(cachedImage) {
        res.header('Content-Type', mime.contentType(format));
        return res.send(Buffer.from(cachedImage, 'base64'));
    }

    try {
        const s3Image = await getImageFromS3(filename);
        const ri = await resizeImage(s3Image.Body, width, height, format);

        // Cache based64 encoded image in Redis for 1hr TTL
        client.setEx(cacheKey, 3600, ri.toString('base64'));

        // Serve the resized imaged
        res.header('Content-Type', mime.contentType(format));
        return res.send(ri);
    }
    catch(error) {
        console.error(error);
        res.status(500).send('Error processing image');
    }
});

app.listen(PORT, () => {
    console.log(`JIT Image Resizer running on port ${PORT}`);
})