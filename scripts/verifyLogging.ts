
import mongoose from 'mongoose';
import { logError } from '../utils/errorLogger';
import { ErrorLog } from '../models/errorLog.schema';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const verifyLogging = async () => {
    try {
        // 1. Connect to MongoDB
        const mongoUri = process.env.MONGODB_SECRET_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("MONGODB_SECRET_URI is missing in env");
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        // Add specific options to avoid timeouts if possible
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to MongoDB');

        // 2. Mock Request
        const mockReq: any = {
            method: 'POST',
            originalUrl: '/api/test-error-logging',
            query: { tenantId: 'verification-tenant' },
            body: { someData: 'testing' },
            user: { id: '000000000000000000000000' }
        };

        // 3. Mock Error
        const mockError = new Error('This is a verification error for logging system');

        // 4. Call logError
        console.log('Calling logError...');
        await logError(mockReq, mockError);

        // 5. Verify it exists in DB
        console.log('Verifying log entry in DB...');
        // Allow a slight delay for async write if any (though await should handle it)
        const logEntry = await ErrorLog.findOne({
            'metadata.query.tenantId': 'verification-tenant',
            message: 'This is a verification error for logging system'
        }).sort({ createdAt: -1 });

        if (logEntry) {
            console.log('✅ Log entry found in Database:');
            console.log(JSON.stringify(logEntry, null, 2));
        } else {
            console.error('❌ Log entry NOT found in Database!');
        }

        // 6. Clean up
        if (logEntry) {
            await ErrorLog.findByIdAndDelete(logEntry._id);
            console.log('Cleaned up test log entry.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Verification script failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

verifyLogging();
