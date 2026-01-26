import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

/**
 * Generic validation middleware using Zod.
 * Validates req.body, req.query, or req.params.
 */
export const validate = (schema: ZodObject<any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: "Validation Error",
                    errors: error.issues.map(err => ({
                        path: err.path.join("."),
                        message: err.message
                    }))
                });
            }
            return res.status(500).json({
                success: false,
                message: "Internal Server Error during validation"
            });
        }
    };
};

/**
 * Validates query parameters.
 */
export const validateQuery = (schema: ZodObject<any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.query);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: "Query Validation Error",
                    errors: error.issues.map(err => ({
                        path: err.path.join("."),
                        message: err.message
                    }))
                });
            }
            return res.status(500).json({
                success: false,
                message: "Internal Server Error during query validation"
            });
        }
    };
};
