"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginationResponse = exports.getPagination = exports.getQueryParam = void 0;
/**
 * Extracts a value from req.query, checking both top-level and nested 'params' object.
 */
const getQueryParam = (req, key) => {
    const query = req.query;
    // 1. Direct check: ?limit=5
    if (query[key] !== undefined)
        return query[key];
    // 2. Nested object check (if extended parser works): ?params[limit]=5 -> query.params.limit
    if (query.params && typeof query.params === 'object' && query.params[key] !== undefined) {
        return query.params[key];
    }
    // 3. Flat string check (if using simple parser): ?params[limit]=5 -> query['params[limit]']
    const flatKey = `params[${key}]`;
    if (query[flatKey] !== undefined)
        return query[flatKey];
    return undefined;
};
exports.getQueryParam = getQueryParam;
const getPagination = (req) => {
    const pageVal = (0, exports.getQueryParam)(req, 'page');
    const limitVal = (0, exports.getQueryParam)(req, 'limit');
    const page = Math.max(Number(pageVal) || 1, 1);
    const limit = Math.min(Number(limitVal) || 10, 100);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
exports.getPagination = getPagination;
const buildPaginationResponse = (page, limit, totalCount) => {
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
exports.buildPaginationResponse = buildPaginationResponse;
