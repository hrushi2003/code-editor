import { mergeOps } from './Coalescing';

// helper: build an "insert text at column" op
const op = (col, text, line = 0) => ({
  startIndx: line,
  startColumn: col,
  endColumn: col + text.length,
  deleteCount: 0,
  newLines: [text],
});

test('merges two adjacent keystrokes', () => {
  const result = mergeOps(op(0, 'a'), op(1, 'b'));
  expect(result.newLines).toEqual(['ab']);
  expect(result.startColumn).toBe(0);
});

test('order of ops does not matter', () => {
  const result = mergeOps(op(1, 'b'), op(0, 'a'));
  expect(result.newLines).toEqual(['ab']);
});

test('inserts in the middle of earlier text', () => {
  const result = mergeOps(op(0, 'abc'), op(1, 'X'));
  expect(result.newLines).toEqual(['aXbc']);
});

test('throws when ops are on different lines', () => {
  expect(() => mergeOps(op(0, 'a', 0), op(0, 'b', 1))).toThrow("Can't merge different lines");
});

test('strips Windows \\r characters', () => {
  const result = mergeOps(op(0, 'a\r'), op(2, 'b'));
  expect(result.newLines[0]).not.toContain('\r');
});