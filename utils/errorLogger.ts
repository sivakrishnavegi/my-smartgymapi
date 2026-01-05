import { Request } from 'express';
import { ErrorLog } from '../models/errorLog.schema';

/**
 * Logs an error to the ErrorLog collection.
 * @param req - The Express Request object.
 * @param error - The error object or message string.
 * @param customMessage - Optional custom message to override or prepend.
 */
export const logError = async (req: Request, error: any, customMessage?: string) => {
    try {
        const errorMsg = customMessage || error.message || 'Unknown Error';
        const stack = error.stack || undefined;

        // Extract metadata from request
        const metadata = {
            query: req.query,
            params: req.params,
            body: req.body, // Be careful with sensitive data in body, maybe sanitize if needed
        };

        // Determine tenantId - look in query, body, or params
        const tenantId = (req.query?.tenantId as string) || req.body?.tenantId || req.params?.tenantId;

        await ErrorLog.create({
            tenantId,
            userId: (req as any).user?.id,
            route: req.originalUrl,
            method: req.method,
            message: errorMsg,
            stack,
            metadata,
        });
    } catch (loggingError) {
        // Fail silently or log to console so as not to disrupt the main flow
        console.error('Failed to write to ErrorLog:', loggingError);
    }
};
