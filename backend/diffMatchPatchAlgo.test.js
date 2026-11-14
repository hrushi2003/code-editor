import { diffMatchPatchAlgo } from './diffMatchPatchAlgo.js';

// helper: build an op the same shape as the Ops collection
const op = (version, { line, endLine = line, startCol, endCol, text, deleteCount = 0 }) => ({
  version,
  payload: {
    startIndx: line,
    endIndx: endLine,
    startColumn: startCol,
    endColumn: endCol,
    newLines: text,
    deleteCount,
  },
});

const doc = (...lines) => ({ code: [...lines] });

test('inserts a character in the middle of a line', () => {
  const result = diffMatchPatchAlgo(
    [op(1, { line: 0, startCol: 1, endCol: 1, text: ['X'] })],
    doc('abc')
  );
  expect(result.code).toEqual(['aXbc']);
});

test('deletes a character', () => {
  const result = diffMatchPatchAlgo(
    [op(1, { line: 0, startCol: 1, endCol: 2, text: [''], deleteCount: 1 })],
    doc('abc')
  );
  expect(result.code).toEqual(['ac']);
});

test('backspace at start of a line merges it into the previous line', () => {
  const result = diffMatchPatchAlgo(
    [op(1, { line: 0, endLine: 1, startCol: 3, endCol: 0, text: [''] })],
    doc('abc', 'def')
  );
  expect(result.code).toEqual(['abcdef']);
});

test('Enter in the middle of a line splits it', () => {
  const result = diffMatchPatchAlgo(
    [op(1, { line: 0, startCol: 2, endCol: 2, text: ['', ''] })],
    doc('abcd', 'next')
  );
  expect(result.code).toEqual(['ab', 'cd', 'next']);
});

test('Enter on the last line does not add extra blank lines', () => {
  const result = diffMatchPatchAlgo(
    [op(1, { line: 0, startCol: 2, endCol: 2, text: ['', ''] })],
    doc('abcd')
  );
  expect(result.code).toEqual(['ab', 'cd']);
});

test('applies ops in version order even if received out of order', () => {
  const result = diffMatchPatchAlgo(
    [
      op(2, { line: 0, startCol: 0, endCol: 0, text: ['b'] }), // typed second
      op(1, { line: 0, startCol: 0, endCol: 0, text: ['a'] }), // typed first
    ],
    doc('')
  );
  expect(result.code).toEqual(['ba']);
});

test('pastes multiple lines in the middle of a line', () => {
  const result = diffMatchPatchAlgo(
    [op(1, { line: 0, startCol: 1, endCol: 1, text: ['X', 'Y', 'Z'] })],
    doc('abc')
  );
  expect(result.code).toEqual(['aX', 'Y', 'Zbc']);
});