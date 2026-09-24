export const DEEPSEEK_FPS = 30;

export const deepSeekShots = [
  {id: 'hook', duration: 6, label: '话题', caption: '七月底，DeepSeek V4 Flash 正式版来了。它的分数，究竟说明什么？'},
  {id: 'release', duration: 7, label: '版本', caption: '这次的 0731 版本，重点不是换名字，而是 Agent 能力的更新。'},
  {id: 'terminal', duration: 9, label: '数据 01', caption: 'DeepSeek 公布的 Terminal Bench 2.1 成绩，从预览版 61.8 到 82.7。'},
  {id: 'deepswe', duration: 8, label: '数据 02', caption: 'DeepSWE 也从 7.3 提升到 54.4，跨度很大。'},
  {id: 'method', duration: 10, label: '看条件', caption: '但要读懂榜单，也得看条件：模型、脚手架和推理档位一起决定结果。'},
  {id: 'process', duration: 8, label: '看过程', caption: '真实任务还会经过理解、调用工具和核验。任何一步都可能改变体验。'},
  {id: 'checklist', duration: 7, label: '怎么测', caption: '所以选模型时，拿同一任务、同一工具和同一预算再测一次。'},
  {id: 'end', duration: 5, label: '结论', caption: '榜单是起点，自己的任务才是答案。'},
] as const;

export type DeepSeekShotId = (typeof deepSeekShots)[number]['id'];
export const DEEPSEEK_DURATION = deepSeekShots.reduce((sum, shot) => sum + shot.duration * DEEPSEEK_FPS, 0);

export const deepSeekSources = {
  modelCard: 'https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-0731',
  release: 'https://deepseek.com/en/news/v4-preview/',
  reference: 'https://www.bilibili.com/video/BV1abuA6pES2/',
};
