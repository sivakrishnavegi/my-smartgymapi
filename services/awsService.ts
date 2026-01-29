import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export class AwsService {
    /**
     * Generates a pre-signed URL for uploading a file to S3.
     */
    static async getPresignedUrl(key: string, contentType: string) {
        const command = new PutObjectCommand({
            Bucket: process.env.AMPLIFY_BUCKET,
            Key: key,
            ContentType: contentType,
        });
        // URL expires in 1 hour
        return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    }

    /**
     * Lists files in the bucket, optionally filtered by a prefix.
     */
    static async listFiles(prefix?: string) {
        const command = new ListObjectsV2Command({
            Bucket: process.env.AMPLIFY_BUCKET,
            Prefix: prefix,
        });
        return await s3Client.send(command);
    }

    /**
     * Checks if a specific file exists in the bucket.
     */
    static async checkFileExists(key: string) {
        try {
            const command = new HeadObjectCommand({
                Bucket: process.env.AMPLIFY_BUCKET,
                Key: key,
            });
            await s3Client.send(command);
            return true;
        } catch (error: any) {
            if (error.name === "NotFound") return false;
            throw error;
        }
    }

    /**
   * Uploads a file buffer directly to S3 (server-side).
   */
    static async uploadBuffer(params: {
        key: string;
        buffer: Buffer;
        contentType: string;
    }) {
        const command = new PutObjectCommand({
            Bucket: process.env.AMPLIFY_BUCKET,
            Key: params.key,
            Body: params.buffer,
            ContentType: params.contentType,
        });
        return await s3Client.send(command);
    }

    /**
     * Deletes a file from S3.
       */
    static async deleteFile(key: string) {
        const command = new DeleteObjectCommand({
            Bucket: process.env.AMPLIFY_BUCKET,
            Key: key,
        });
        return await s3Client.send(command);
    }
}
