const { LinkedList } = require('./LinkedList');

test('inserts lines in order', () => {
  const list = new LinkedList();
  list.insertLineAfter(null, 'a');
  list.insertLineAfter('a', 'b');
  list.insertLineAfter('a', 'c');

  expect(list.printText()).toEqual(['a', 'c', 'b']);
});

test('deleting the first line updates head', () => {
  const list = new LinkedList();
  list.insertLineAfter(null, 'a');
  list.insertLineAfter('a', 'b');

  list.deleteLine('a');

  expect(list.printText()).toEqual(['b']);
});

test('deleting the last line then appending works', () => {
  const list = new LinkedList();
  list.insertLineAfter(null, 'a');
  list.insertLineAfter('a', 'b');
  list.insertLineAfter(null, 'c');

  list.deleteLine('c');
  list.insertLineAfter(null, 'd');

  expect(list.printText()).toEqual(['a', 'b', 'd']);
});