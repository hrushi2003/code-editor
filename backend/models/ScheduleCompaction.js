import cron from 'node-cron';
import Ops from './Ops.js';
import { CodeSchema } from './codes';
import { diffMatchPatchAlgo } from '../diffMatchPatchAlgo.js';

cron.schedule('*/10 * * * *', async () => {
    const bigOps = await Ops.aggregate([
        { $group: { _id: "$codeId", count: { $sum: 1 } } },
        { $match: { count: { $gt: 1000 } } }
    ]);
    for (const entry of bigOps) {
        await runCompaction(entry._id);
    }
}); // Runs every 10 minutes

const runCompaction = async (codeId) => {
    try {
        const ops = await Ops.find({ codeId }).sort({ version: 1 });
        if (ops.length === 0) return;
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
        await Ops.deleteMany({ codeId });
        console.log(`Compaction completed for codeId: ${codeId}`);
    }
    catch(error) {
        console.error("Error during compaction:", error);
    }
}
