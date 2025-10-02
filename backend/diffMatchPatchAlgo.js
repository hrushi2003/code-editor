export const diffMatchPatchAlgo = (changedCodePos, codeDoc) => {
    try {
        changedCodePos.sort((a, b) => {
            return new Date(a.timeStamps) - new Date(b.timeStamps);
        });
    }
    catch (error) {
        err.message = "error in sorting";
        throw err;
    }
    try {
        changedCodePos.forEach(patch => {
            const { startIndx, deleteCount, endIndx = startIndx, newLines, startColumn, endColumn } = patch.payload;
           if ((startIndx >= 0 && startIndx < codeDoc.code.length) && (newLines.length == 1 && endIndx - startIndx == 0)) {
                var line = codeDoc.code[startIndx];
                if (line == null) {
                    codeDoc.code.splice(startIndx, 0, ...newLines);
                }
                else {
                    var newLine = line.substring(0, startColumn) + newLines.join("") +
                        line.substring(endColumn);
                    if (newLine.trim() == "") {
                        codeDoc.code.splice(startIndx, 1);
                    }
                    else codeDoc.code[startIndx] = newLine;
                }
           }
            else if (endIndx - startIndx > 0
                &&
                (deleteCount > 1 && newLines.length == 1)
            ) {
                let codeAtPos = codeDoc.code[endIndx];
                codeDoc.code[startIndx] += codeAtPos;
                codeDoc.code.splice(endIndx, 1);
            }

            else {
                let joinedLines = newLines.join("");
                let newLinesR = joinedLines.includes('\r') ? joinedLines.split('\r') : newLines;
                while (startIndx > codeDoc.code.length - 1) {
                    codeDoc.code.push('');
                }
                const lineAtStart = codeDoc.code[startIndx];
                const BeforeLine = lineAtStart.substring(0, startColumn);
                codeDoc.code[startIndx] = BeforeLine + newLinesR[0];
                if (newLinesR.length > 1 && startIndx + 1 > codeDoc.code.length - 1) {
                    for (let i = 0; i < newLinesR.length; i++) codeDoc.code.push('');
                }
                for (let i = 1; i < newLinesR.length - 1; i++) {
                    codeDoc.code.splice(startIndx + i, 0, newLinesR[i]);
                }
                if (newLines.length > 1) codeDoc.code.splice(startIndx + newLinesR.length - 1, 0, newLinesR[newLinesR.length - 1] + lineAtStart.substring(startColumn));
            }
        });
        return codeDoc;
    } catch (error) {
        return {
            "message": "error in saving code",
            "data": changedCodePos
        };
    }
}