import test from 'node:test';
import assert from 'node:assert/strict';
import { whereIntent } from './whereIntent';

test('Bangla and English "where" questions map to a place kind', () => {
  assert.equal(whereIntent('চা কোথায় পাবো?'), 'tea');
  assert.equal(whereIntent('চা খাবো কোথায়'), 'tea');
  assert.equal(whereIntent('হোটেলে ফিরব কীভাবে'), 'hotel');
  assert.equal(whereIntent('জমজম পানি কোথায়'), 'water');
  assert.equal(whereIntent('কাছে টয়লেট কই'), 'toilet');
  assert.equal(whereIntent('ভাত খেতে চাই, কোথায় পাবো'), 'food');
  assert.equal(whereIntent('where can I get tea'), 'tea');
  assert.equal(whereIntent('take me back to my hotel'), 'hotel');
});

test('not a where question', () => {
  assert.equal(whereIntent('ভুলে আতর লেগেছে'), null);
  assert.equal(whereIntent('তাওয়াফ কিভাবে করব'), null);
});
