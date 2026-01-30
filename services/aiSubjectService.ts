import { SubjectModel } from "../models/subject.model";
import { AiSubjectConfigModel } from "../models/AiSubjectConfig.model";
import { AiDocumentModel } from "../models/AiDocument.model";
import { Types } from "mongoose";
import { cacheService } from "./cacheService";

/**
 * Get the consolidated Control Tower list for a school
 */
export const getControlTowerList = async (params: {
    tenantId: string;
    schoolId: string;
    skip?: number;
    limit?: number;
}) => {
    const { tenantId, schoolId, skip = 0, limit = 10 } = params;

    // 0. Cache Check
    const cacheKey = cacheService.generateKey("ct", tenantId, schoolId, `p${skip}:l${limit}`);
    const cachedData = await cacheService.get<{ data: any[], total: number }>(cacheKey);
    if (cachedData) return cachedData;

    // 1. Fetch academic subjects for this school (paginated)
    const filter = { tenantId, schoolId: new Types.ObjectId(schoolId) };
    const [subjects, total] = await Promise.all([
        SubjectModel.find(filter).lean().skip(skip).limit(limit),
        SubjectModel.countDocuments(filter)
    ]);
    const subjectIds = subjects.map(s => new Types.ObjectId((s as any)._id));

    // 2. Aggregate document stats (chunks and last sync)
    // We count vectorIds for chunks and find the latest update
    const stats = await AiDocumentModel.aggregate([
        {
            $match: {
                tenantId,
                schoolId: new Types.ObjectId(schoolId),
                isDeleted: false,
                status: "indexed",
                subjectId: { $in: subjectIds }
            }
        },
        {
            $group: {
                _id: "$subjectId",
                vectorChunks: {
                    $sum: {
                        $cond: {
                            if: { $isArray: "$vectorIds" },
                            then: { $size: "$vectorIds" },
                            else: 0
                        }
                    }
                },
                lastSync: { $max: "$updatedAt" }
            }
        }
    ]);

    // 3. Fetch AI Configs
    const configs = await AiSubjectConfigModel.find({ tenantId, schoolId: new Types.ObjectId(schoolId) }).lean();

    // 4. Merge data
    const data = subjects.map(subject => {
        const config = configs.find(c => c.subjectId.toString() === subject._id.toString());
        const stat = stats.find(s => s._id.toString() === subject._id.toString());

        return {
            subjectId: subject._id,
            subjectName: subject.name,
            enabledClasses: config?.enabledClasses || [],
            aiStatus: config?.isActive ? "Active" : "Inactive",
            vectorChunks: stat?.vectorChunks || 0,
            lastSync: stat?.lastSync || null,
        };
    });

    const result = { data, total };
    await cacheService.set(cacheKey, result, 3600); // 1-hour cache

    return result;
};

/**
 * Toggle AI status for a subject
 */
export const toggleSubjectAi = async (params: {
    tenantId: string;
    schoolId: string;
    subjectId: string;
    isActive: boolean;
    enabledClasses?: string[];
}) => {
    const { tenantId, schoolId, subjectId, isActive, enabledClasses } = params;

    return await AiSubjectConfigModel.findOneAndUpdate(
        { tenantId, schoolId: new Types.ObjectId(schoolId), subjectId: new Types.ObjectId(subjectId) },
        {
            $set: {
                isActive,
                enabledClasses: enabledClasses?.map(id => new Types.ObjectId(id)) || []
            }
        },
        { upsert: true, new: true }
    );
};
