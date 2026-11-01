import test from 'node:test';
import assert from 'node:assert/strict';
import { haversine } from './haversine.js';

test('same point is 0 m', () => {
  assert.equal(haversine(14.5995, 120.9842, 14.5995, 120.9842), 0);
});

test('one degree of latitude is about 111.2 km', () => {
  const d = haversine(0, 0, 1, 0);
  assert.ok(Math.abs(d - 111195) < 100, `got ${d}`);
});

test('0.0009 degrees of latitude is about 100 m', () => {
  const d = haversine(14.5995, 120.9842, 14.5995 + 0.0009, 120.9842);
  assert.ok(d > 99 && d < 101, `got ${d}`);
});

test('distance is symmetric', () => {
  const a = haversine(14.58, 120.97, 14.65, 121.06);
  const b = haversine(14.65, 121.06, 14.58, 120.97);
  assert.ok(Math.abs(a - b) < 1e-6);
});
