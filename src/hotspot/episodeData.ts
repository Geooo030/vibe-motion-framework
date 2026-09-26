export const EPISODE_FPS = 30;
export const EPISODE_DURATION = 1740;

export type Shot = {
  id: string;
  from: number;
  to: number;
  label: string;
  caption: string;
  kind: 'hook' | 'split' | 'chain' | 'truth' | 'break' | 'checklist' | 'end';
};

export const shots: Shot[] = [
  {id:'s010',from:0,to:302,label:'别只看峰值',kind:'hook',caption:'Wi-Fi 7，为什么测速不一定翻倍？'},
  {id:'s020',from:302,to:545,label:'三条频段',kind:'split',caption:'2.4G 穿墙、5G 更快、6G 更干净'},
  {id:'s030',from:545,to:888,label:'多链路操作',kind:'chain',caption:'MLO：兼容设备可同时利用多条链路'},
  {id:'s040',from:888,to:1065,label:'两个收益',kind:'truth',caption:'叠加带宽，也能减少排队和抖动'},
  {id:'s050',from:1065,to:1216,label:'三项前提',kind:'break',caption:'路由器、终端、地区频段都要支持'},
  {id:'s060',from:1216,to:1502,label:'找到瓶颈',kind:'checklist',caption:'无线、网口、宽带：最慢的一环决定体验'},
  {id:'s070',from:1502,to:1740,label:'结论',kind:'end',caption:'价值不只在峰值，更在忙的时候稳不稳'},
];

