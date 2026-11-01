import test from 'node:test';
import assert from 'node:assert/strict';
import { toCsv } from './csv.js';

test('quotes cells with commas and quotes', () => {
  assert.equal(toCsv([['a,b', 'say "hi"']]), '"a,b","say ""hi"""');
});

test('neutralises spreadsheet formulas', () => {
  assert.equal(toCsv([['=SUM(A1)', '+1', '-2', '@x']]), "'=SUM(A1),'+1,'-2,'@x");
});

test('handles empty cells and numbers', () => {
  assert.equal(toCsv([['a', null, undefined, 5, false]]), 'a,,,5,false');
});
