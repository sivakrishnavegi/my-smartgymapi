import { Request } from 'express';

export interface PaginationResult {
    page: number;
    limit: number;
    skip: number;
}

/**
 * Extracts a value from req.query, checking both top-level and nested 'params' object.
 */
export const getQueryParam = (req: Request, key: string): any => {
    const query = req.query as any;
    // 1. Direct check: ?limit=5
    if (query[key] !== undefined) return query[key];

    // 2. Nested object check (if extended parser works): ?params[limit]=5 -> query.params.limit
    if (query.params && typeof query.params === 'object' && query.params[key] !== undefined) {
        return query.params[key];
    }

    // 3. Flat string check (if using simple parser): ?params[limit]=5 -> query['params[limit]']
    const flatKey = `params[${key}]`;
    if (query[flatKey] !== undefined) return query[flatKey];

    return undefined;
};

export const getPagination = (req: Request): PaginationResult => {
    const pageVal = getQueryParam(req, 'page');
    const limitVal = getQueryParam(req, 'limit');

    const page = Math.max(Number(pageVal) || 1, 1);
    const limit = Math.min(Number(limitVal) || 10, 100);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

export const buildPaginationResponse = (
    page: number,
    limit: number,
    totalCount: number
) => {
    const totalPages = Math.ceil(totalCount / limit);

    return {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};
