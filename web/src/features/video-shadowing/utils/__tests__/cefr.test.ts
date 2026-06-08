import { describe, expect, it } from 'vitest';
import { classifyCefr, type CefrLevel } from '../cefr';

const rank: Record<CefrLevel | 'Auto', number> = { Auto: 0, A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

describe('classifyCefr (vocabulary profiling)', () => {
  it('returns Auto when there is too little text to judge', () => {
    expect(classifyCefr('Hello there')).toBe('Auto');
  });

  it('rates simple everyday text in the A1–B1 range', () => {
    const simple =
      'I have a cat. The cat is big and black. I like my cat very much. We play in the park every day. My cat is always happy when I come home.';
    expect(['A1', 'A2', 'B1']).toContain(classifyCefr(simple));
  });

  it('rates academic / abstract prose at B2 or above', () => {
    const academic =
      'The research demonstrates a significant correlation between rapid economic development and environmental degradation, although the underlying mechanisms remain subject to considerable debate among contemporary scholars.';
    expect(['B2', 'C1', 'C2']).toContain(classifyCefr(academic));
  });

  it('ranks simpler text strictly below more complex text', () => {
    const simple = 'My friend and I went to the shop to buy some bread, milk and eggs for breakfast.';
    const complex =
      'The unprecedented proliferation of pervasive digital surveillance technologies has engendered profound philosophical controversies concerning the delicate equilibrium between collective security and individual autonomy.';
    expect(rank[classifyCefr(simple)]).toBeLessThan(rank[classifyCefr(complex)]);
  });
});
