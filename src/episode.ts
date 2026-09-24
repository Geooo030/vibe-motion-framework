/** Swap these values and the scene content to produce a new episode. */
export const episode = {
  brand: '热点君',
  number: '001',
  category: 'AI 观察',
  title: ['跑分第一，', '就真的最好用？'],
  footer: '把热点说清楚',
  captions: {
    hook: '榜单第一，不等于你的任务也能第一。',
    contrast: '考题测的是单项，体验看的是全程。',
    workflow: '理解、执行、核验，少一步都可能翻车。',
    takeaway: '所以，先看任务，再看榜单。',
  },
  /** Paths relative to public/. Add your own licensed image or video here. */
  assets: {
    hook: null as null | {kind: 'image' | 'video'; src: string},
    contrast: null as null | {kind: 'image' | 'video'; src: string},
    workflow: null as null | {kind: 'image' | 'video'; src: string},
    takeaway: null as null | {kind: 'image' | 'video'; src: string},
  },
};
