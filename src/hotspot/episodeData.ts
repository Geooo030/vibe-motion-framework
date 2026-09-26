export const EPISODE_FPS = 30;
export const EPISODE_DURATION = 1620;

export type Shot = {
  id: string;
  from: number;
  to: number;
  label: string;
  caption: string;
  kind: 'hook' | 'split' | 'chain' | 'truth' | 'break' | 'checklist' | 'end';
};

export const shots: Shot[] = [
  {id:'s010',from:0,to:274,label:'钓鱼陷阱',kind:'hook',caption:'密码 + 短信验证码，仍可能被实时转发'},
  {id:'s020',from:274,to:545,label:'换规则',kind:'split',caption:'Passkey：设备存私钥，网站只存公钥'},
  {id:'s030',from:545,to:753,label:'挑战签名',kind:'chain',caption:'挑战 → 本地签名 → 返回验证'},
  {id:'s040',from:753,to:983,label:'域名绑定',kind:'truth',caption:'假域名拿不到正确签名'},
  {id:'s050',from:983,to:1144,label:'生物识别',kind:'break',caption:'指纹只在本机解锁，不发给网站'},
  {id:'s060',from:1144,to:1310,label:'仍需防护',kind:'checklist',caption:'设备、同步账号、恢复流程仍要保护'},
  {id:'s070',from:1310,to:1620,label:'升级顺序',kind:'end',caption:'Passkey 优先；恢复方式可靠；短信只做后备'},
];

