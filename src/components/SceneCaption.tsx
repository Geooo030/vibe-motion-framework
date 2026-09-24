import type {ReactNode} from 'react';

export const SceneCaption: React.FC<{children: ReactNode}> = ({children}) => (
  <div style={{position: 'absolute', left: 16, right: 16, bottom: 0, minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '16px 24px', background: 'rgba(10,18,22,.93)', borderTop: '1px solid rgba(160,229,226,.25)', fontSize: 35, fontWeight: 800, lineHeight: 1.32, textShadow: '0 2px 10px rgba(0,0,0,.7)'}}>{children}</div>
);
