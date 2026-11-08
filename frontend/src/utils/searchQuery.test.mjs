import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSearchQuery, formatSearchQuery} from './searchQuery.ts';

test('plain content searches posts, including an embedded prefix', () => {
  assert.deepEqual(parseSearchQuery(' React u/an '), {type:'posts',keyword:'React u/an'});
});
test('user and community prefixes are stripped and case insensitive', () => {
  assert.deepEqual(parseSearchQuery(' U/ Nguyễn An '), {type:'people',keyword:'Nguyễn An'});
  assert.deepEqual(parseSearchQuery(' c/react '), {type:'communities',keyword:'react'});
});
test('prefix without keyword stays empty instead of listing everything', () => {
  assert.deepEqual(parseSearchQuery('u/ '), {type:'people',keyword:''});
  assert.deepEqual(parseSearchQuery('c/'), {type:'communities',keyword:''});
  assert.deepEqual(parseSearchQuery(' '), {type:'posts',keyword:''});
});
test('switching search type preserves keyword and round trips', () => {
  for (const type of ['posts','people','communities']) {
    assert.deepEqual(parseSearchQuery(formatSearchQuery(type,'React')), {type,keyword:'React'});
  }
});
