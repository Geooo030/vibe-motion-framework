export const EPISODE_FPS = 30;
export const EPISODE_DURATION = 1470;

export type Shot = {
  id: string;
  from: number;
  to: number;
  label: string;
  caption: string;
  kind: 'hook' | 'split' | 'chain' | 'truth' | 'break' | 'checklist' | 'end';
};

export const shots: Shot[] = [
  {id:'s010',from:0,to:257,label:'真假焦虑',kind:'hook',caption:'AI 水印，真能一眼验假吗？'},
  {id:'s020',from:257,to:489,label:'两类水印',kind:'split',caption:'像素水印怕裁切、截图和压缩'},
  {id:'s030',from:489,to:728,label:'内容凭证',kind:'chain',caption:'C2PA 给文件附上一条可验证的履历'},
  {id:'s040',from:728,to:885,label:'边界',kind:'truth',caption:'验证履历完整 ≠ 证明事件真实'},
  {id:'s050',from:885,to:1027,label:'缺失不等于假',kind:'break',caption:'转码会丢凭证；缺失不能直接判假'},
  {id:'s060',from:1027,to:1230,label:'三步核验',kind:'checklist',caption:'凭证链 → 反向搜索 → 首发上下文'},
  {id:'s070',from:1230,to:1470,label:'结论',kind:'end',caption:'可靠的不是单个水印，而是证据链'},
];

