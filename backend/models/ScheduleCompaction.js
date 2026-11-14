import cron from 'node-cron';
import { Ops } from './Ops.js';                 // fix: named export
import { CodeSchema } from './codes.js';   // ✅ the file next to this one      // fix: .js extension required in ES modules
import { diffMatchPatchAlgo } from '../diffMatchPatchAlgo.js';

// Every 10 minutes, compact any file with more than 1000 pending ops
cron.schedule('*/10 * * * *', async () => {
    const bigOps = await Ops.aggregate([
        { $group: { _id: "$codeId", count: { $sum: 1 } } },
        { $match: { count: { $gt: 1000 } } }
    ]);
    for (const entry of bigOps) {
        await runCompaction(entry._id);
    }
});

export const runCompaction = async (codeId) => {
    try {
        const ops = await Ops.find({ codeId }).sort({ version: 1 });
        if (ops.length === 0) return;

        const maxVersion = ops[ops.length - 1].version;   // remember what we compacted

        const codeDoc = await CodeSchema.findById(codeId);
        if (!codeDoc) return;

        const compactedCodeDoc = diffMatchPatchAlgo(ops, codeDoc);
        if (compactedCodeDoc.message) {
            console.error("Compaction error:", compactedCodeDoc.message);
            return;
        }
        codeDoc.code = compactedCodeDoc.code;
        codeDoc.version += ops.length;
        await codeDoc.save();

        // fix: delete ONLY the ops we compacted, not ones that arrived meanwhile
        await Ops.deleteMany({ codeId, version: { $lte: maxVersion } });
        console.log(`Compaction completed for codeId: ${codeId}`);
    } catch (error) {
        console.error("Error during compaction:", error);
    }
}; 