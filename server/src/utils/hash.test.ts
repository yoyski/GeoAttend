import test from 'node:test';
import assert from 'node:assert/strict';
import { hashSecret, verifySecret } from './hash.js';
import { generatePasscode } from './tokens.js';

test('hash verifies the right secret and rejects a wrong one', () => {
  const h = hashSecret('abc123');
  assert.ok(verifySecret('abc123', h));
  assert.ok(!verifySecret('abc124', h));
  assert.ok(!verifySecret('abc123', 'garbage'));
});

test('hashing the same secret twice gives different hashes', () => {
  assert.notEqual(hashSecret('same'), hashSecret('same'));
});

test('generated passcode looks like XXXXX-XXXXX with no look-alike characters', () => {
  for (let i = 0; i < 50; i++) {
    assert.match(generatePasscode(), /^[A-HJ-NP-Za-km-z2-9]{5}-[A-HJ-NP-Za-km-z2-9]{5}$/);
  }
});
