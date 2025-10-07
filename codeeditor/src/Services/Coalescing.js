const { LinkedList } = require('./LinkedList');
let map = new Map();
let lineMapping = new Map();
let arrayOrder = new LinkedList();
const ApplyCoalscing = (payload) => {
    const start = performance.now();
    for (let i = 0; i < payload.length; i++) {
        const py = {...payload[i]};
        batching(py, map, "h");
    }
    const res = arrayOrder.printText();
    const ops = [];
    for (let i = 0; i < res.length; i++) {
        ops.push(map.get(res[i]));
    }
    arrayOrder = new LinkedList();
    lineMapping = new Map();
    map = new Map();
    const end = performance.now();
    console.log(end - start, "process");
    return ops;
}
const batching = (bufferOps, map, text) => {
    let indx = lineMapping.get(bufferOps.startIndx) ?? null;
    const id = crypto.randomUUID();
    if (indx == null) {
        lineMapping.set(bufferOps.startIndx, id);
        map.set(id, bufferOps);
        arrayOrder.insertLineAfter(null, id, text);
    }
    else if (bufferOps.newLines.length === 1) {
        const prevOps = map.get(indx);
        const newMergedOps = mergeOps(prevOps, bufferOps);
        if (newMergedOps) {
            map.set(indx, newMergedOps);
        }
    }
    else {
        const startOps = map.get(indx);
        const opsTosend = {
            ...bufferOps,
            newLines: [bufferOps.newLines[0]]
        }
        const newOps = mergeOps(opsTosend, startOps);
        map.set(indx, newOps);
        let prev = null;
        for (let i = 1; i < bufferOps.newLines.length; i++) {
            let opsToSend = {
                startIndx: bufferOps.startIndx + i,
                startColumn: 0,
                endColumn: bufferOps.newLines[i].length ?? 1,
                deleteCount: 0,
                newLines: [bufferOps.newLines[i]]
            }
            const id = crypto.randomUUID();
            map.set(id, opsToSend);
            lineMapping.set(bufferOps.startIndx + i, id);
            if (prev == null) {
                arrayOrder.insertLineAfter(indx, id, text);
                prev = id;
            }
            else {
                arrayOrder.insertLineAfter(prev, id, text);
                prev = id;
            }
        }
    }
}


function mergeOps(op1, op2) {
    if (op1.startIndx !== op2.startIndx) {
        console.log("first", op1, "second", op2);
        throw new Error("Can't merge different lines");
    }

    let [first, second] = op1.startColumn <= op2.startColumn ? [op1, op2] : [op2, op1];

    const startColumn = Math.min(first.startColumn, second.startColumn);

    const totalDeleteCount = first.deleteCount + second.deleteCount;

    const deleteCount = first.deleteCount !== 0 ? first.deleteCount : second.deleteCount;
    first.newLines[0] = first.newLines[0].replace('/\r/g','');
    const newString = first.newLines[0].substring(0, second.startColumn - first.startColumn) +
        second.newLines.join("").replace('/\r/g', '') +
        first.newLines[0].substring((second.startColumn) - first.startColumn + deleteCount);

    let endColumn;
    if (newString.length === 0) {
        // deletion only
        endColumn = startColumn + totalDeleteCount;
    } else {
        endColumn = startColumn + newString.length - 1;
    }
    return {
        startIndx: first.startIndx,
        startColumn,
        endColumn: endColumn,
        deleteCount: totalDeleteCount,
        newLines: [newString]
    };
}
export default ApplyCoalscing;