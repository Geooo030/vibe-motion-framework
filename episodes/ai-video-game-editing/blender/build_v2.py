"""Paper-stage Blender draft. Reuses v1 geometry helpers, never v1 outputs.
All scene motion is baked from deterministic frame/beat state into native keys.
"""
from pathlib import Path
_base=Path(__file__).with_name('build_scenes.py')
exec(compile(_base.read_text(encoding='utf-8').split('selected=[s for s in PLAN')[0],str(_base),'exec'))
import random, time
OUT=ROOT/'out/ai-video-game-editing/blender-v2'
FONT_PATH=EP/'assets/fonts/LXGWWenKaiTC-Regular.ttf'
COL.update(paper='F6F3E9',ink='302D27',teal='7EBDB3',orange='C96F58',gold='F2CF65',muted='C9C4B7',panel='FAF8EF',edge='302D27')

def ease(t,a,b):
    v=max(0,min(1,(t-a)/max(.001,b-a)));return v*v*(3-2*v)
def lerp(a,b,p):return a+(b-a)*p
def xy(o,x,z,y=-2):o.location=(x,y,z)
def size(o,s):o.scale=(max(.0001,s),)*3
def group(name,fn):
    before=set(bpy.context.scene.objects);fn();r=empty(name)
    for o in set(bpy.context.scene.objects)-before-{r}:
        if o.parent is None:o.parent=r
    return r
def line(name,points,color='ink',width=.022,y=-2):
    cv=bpy.data.curves.new(name,'CURVE');cv.dimensions='3D';cv.resolution_u=2;cv.bevel_depth=width;cv.bevel_resolution=1
    sp=cv.splines.new('POLY');sp.points.add(len(points)-1)
    for p,(x,z) in zip(sp.points,points):p.co=(x,y,z,1)
    ob=bpy.data.objects.new(name,cv);bpy.context.collection.objects.link(ob);cv.materials.append(material(color));return ob
def box(name,x,z,w,h,color='paper',y=-1):
    def draw():
        cube(name+' shadow',.04,.08,-.045,w,.02,h,'DCD6C8')
        cube(name+' face',0,0,0,w,.025,h,color)
        line(name+' ink',[(-w/2,-h/2),(-w/2-.013,h/2),(w/2,h/2+.016),(w/2+.01,-h/2),(-w/2,-h/2)],width=.014,y=-.03)
        line(name+' pencil',[(-w/2+.06,h/2-.025),(w*.1,h/2+.032),(w/2-.06,h/2-.008)],'muted',.008,y=-.04)
    r=group(name,draw);xy(r,x,z,y);return r
def label(body,x,z,s=.32,c='ink',y=-2,align='LEFT',parent=None):
    o=text(body,x,z,s,c,y,align)
    if parent:o.parent=parent
    return o
def card(name,x,z,w,h,title,color='paper',s=.32):
    r=box(name,x,z,w,h,color,y=-2.3)
    label(title,0,-s*.3,s,y=-.08,align='CENTER',parent=r)
    return r
def curve_arm():
    outer=line('Claude flexible arm',[(0,0)]*17,'ink',.078,y=-2.6)
    inner=line('Claude arm fill',[(0,0)]*17,'orange',.052,y=-2.64)
    hand=box('hand',0,0,.19,.18,'orange',y=-2.72)
    return outer,inner,hand
def arm_set(arm,start,end,f):
    for ob in arm[:2]:
        for i,p in enumerate(ob.data.splines[0].points):
            u=i/16;xx=lerp(start[0],end[0],u);zz=lerp(start[1],end[1],u)-.48*math.sin(math.pi*u)
            p.co=(xx,ob.data.splines[0].points[i].co.y,zz,1);p.keyframe_insert('co',frame=f)
    xy(arm[2],end[0],end[1],-2.72)
def paper_helper(x,z):
    r=group('Claude paper puppet',lambda:None)
    body=box('Claude body',0,.47,.95,.66,'orange',y=0);body.parent=r
    for xx in [-.32,-.11,.11,.32]:cube('Claude leg',xx,0,.04,.12,.08,.28,'orange',r)
    for xx in [-.21,.21]:cube('Claude eye',xx,-.1,.49,.055,.05,.13,'ink',r)
    smile=line('Claude smile',[(-.1,.32),(0,.28),(.1,.32)],width=.015,y=-.1);smile.parent=r
    xy(r,x,z,-2.4);return r
def setup2(s):
    global MATS
    bpy.ops.wm.read_factory_settings(use_empty=True);MATS={}
    sc=bpy.context.scene;sc.name=s['id'];sc.render.engine='BLENDER_EEVEE_NEXT';sc.eevee.taa_render_samples=opt.samples
    sc.render.resolution_x=opt.width;sc.render.resolution_y=round(opt.width*9/16);sc.render.resolution_percentage=100
    sc.render.fps=30;sc.frame_start=1;sc.frame_end=s['endFrame']-s['startFrame'];sc.frame_step=opt.frame_step
    sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGB';sc.render.image_settings.compression=15
    sc.world=bpy.data.worlds.new('World');sc.view_settings.view_transform='Standard'
    bpy.ops.object.camera_add(location=(0,-30,5));cam=bpy.context.object;cam.rotation_euler=(math.pi/2,0,0);cam.data.type='ORTHO';cam.data.ortho_scale=18;sc.camera=cam
    cube('paper backdrop',0,4,5,30,.05,20,'paper')
    rng=random.Random(42)
    for i in range(95):
        x=rng.uniform(-9,9);z=rng.uniform(0,10);line('paper grain',[(x,z),(x+.014,z+.008)],'E7E2D6',.008,y=3)
    for a in s['actionBeats']:sc.timeline_markers.new(a['action'][:48],frame=1+a['startLocalBeat']*9)
    return sc
def stage(s):
    box('game preview',1.8,6.3,12.4,5.1,'E7EEE2',y=.4)
    label('汤姆猫的通关剪辑',-4.2,8.65,.28,'ink',y=-.4)
    for x in [-2,1.5,5.4]:
        cube('pixel cloud',x,.1,7.9,1.4,.03,.16,'FAFCF6');cube('cloud cap',x-.2,.1,8.07,.62,.03,.18,'FAFCF6')
    for i in range(24):
        x=-4+i*.51
        if s['scene']=='edit' and -.2<x<2.9:continue
        cube('soil',x,0,3.96,.5,.1,.35,'C68A5C');cube('grass',x,-.1,4.15,.5,.12,.09,'teal')
    for x in [-2.6,4.9]:
        cube('pipe',x,.02,4.65,.52,.1,.88,'teal');cube('pipe lip',x,-.02,5.11,.76,.1,.15,'teal')
    box('asset drawer',-6.65,6.3,3,5.1,'paper',y=.3)
    label('素材抽屉',-7.9,8.45,.33)
    sprite('library cat',MASTER,-6.7,6.5,1.45,y=-.5)
    label('汤姆猫.png',-7.63,6.33,.25)
    label('本期目标',-7.9,5.85,.3)
    done={'collect':0,'edit':1,'bug':2,'princess':2,'export':2}.get(s['scene'],0)
    marks=[]
    for i,word in enumerate(['镜头齐','声画合拍','成片导出']):
        label(word,-7.25,5.35-i*.43,.27)
        box('task checkbox',-7.65,5.45-i*.43,.2,.2,'paper',y=-1)
        mark=line('task tick',[(-.08,0),(-.01,-.05),(.11,.09)],'teal',.025,y=-2)
        mark.location=(-7.65,0,5.45-i*.43);size(mark,1 if done>i else 0);marks.append(mark)
    box('timeline panel',0,2.1,16.3,2.25,'paper',y=.3)
    label('时间轴',-7.9,2.85,.28)
    trackcolors=['teal','orange','gold','muted'];clips=[]
    for row,name in enumerate(['V1 游戏','V2 角色','A1 音乐','A2 音效']):
        z=2.58-row*.39;label(name,-7.8,z-.06,.22)
        cube('track bed',.8,.1,z,12.75,.02,.27,'E8E4D9')
        for j in range(4):
            c=cube('clip %s %s'%(row,j),-4.4+j*3.1,-.08,z,2.98,.03,.22,trackcolors[row]);clips.append(c)
    play=cube('playhead',-5.8,-.5,2.04,.027,.03,1.85,'orange')
    label('大厂汤姆猫',7.9,.56,.23,'ink',align='RIGHT')
    return marks,clips,play
def room():
    cube('night room',0,2.5,5,25,.05,15,'101B38')
    box('window',-6,6.5,3,3,'24324C',y=1)
    for i in range(5):cube('city',-7+i*.5,.7,5.7+i%2*.3,.35,.1,.8+i%2*.5,'344867')
    cube('moon',-5.2,.6,7.35,.35,.03,.35,'gold')
    cube('desk',0,.2,2.2,16,.6,.18,'A88061')
    for x in [-6.5,6.5]:cube('table leg',x,.5,1,.2,.3,2.3,'745844')
    monitor=box('monitor',3.3,5.05,6.8,4.15,'paper',y=.3)
    cube('monitor stem',3.3,.3,2.8,.3,.1,.7,'muted');cube('monitor foot',3.3,.1,2.43,1.7,.2,.15,'muted')
    cube('keyboard',2.8,-.2,2.39,3.6,.2,.12,'muted')
    for i in range(12):cube('keyboard key',1.35+i*.26,-.35,2.52,.18,.1,.08,'paper')
    cube('lamp stem',-7.6,.1,3.5,.09,.1,2.5,'gold');cube('lamp head',-7.1,.1,4.8,1.1,.12,.2,'gold')
    cube('cup',-6,-.4,2.6,.5,.1,.65,'blue')
    label('02:37',6.2,2.7,.32,'blue',align='RIGHT')
    label('我的打怪视频',.4,6.5,.3);label('尚未开始…',.4,5.8,.26,'muted')

def make(s):
    sc=setup2(s);mode=s['scene'];n=sc.frame_end;roommode=mode in ['desk','thought','emerge','portal','return','done']
    if roommode:room();marks=[];clips=[];play=None
    else:marks,clips,play=stage(s)
    cat=sprite('Tomcat unchanged pixel identity',SLEEP if mode in ['desk','thought','return','done'] else MASTER,-3.4 if roommode else -1.8,2.35 if roommode else 4.2,3.8 if roommode else 2.05,y=-1.6)
    helper=paper_helper(4.8 if roommode else -4.7,4.2 if roommode else 3.52)
    arm=curve_arm();objects={};dynamic=[]
    if mode in ['thought','emerge']:
        objects['thought']=card('thought note',-2,7.9,7.4,1.1,'做个汤姆猫打怪视频，就好了。',s=.36)
    if mode=='desk':objects['thought']=card('sleepy thought',-2.5,7.8,6.4,1,'如果 AI 能帮我……',s=.42)
    if mode=='portal':
        objects['selection']=group('selection box',lambda:line('selection outline',[(-1.9,0),(-1.9,3.8),(1.9,3.8),(1.9,0),(-1.9,0)],'gold',.025,y=-.15))
    if mode=='branch':
        objects['note']=box('Git command',1.2,6.5,10,2.3,'paper',y=-2)
        label('git switch -c',-3.4,7,.38,y=-2.2);label('episode/04-ai-video-game-editing',-3.4,6.42,.29,y=-2.2)
        objects['enter']=card('Enter',3.9,5.6,1.5,.6,'Enter',s=.28)
        objects['branch']=line('new branch',[(-2,5.7),(-1,5.7),(-.4,6.0),(.4,6.0)],'orange',.045,y=-2.4)
    if mode=='skills':
        objects['held']=sprite('held cat sticker',MASTER,-1,6.2,1.15,y=-2.9)
        objects['cards']=[card('skill '+a,-1+i*2.7,7,2.4,.95,a,s=.38) for i,a in enumerate(['搭场景','对节拍','查成片'])]
    if mode=='script':
        objects['cards']=[card('story '+a,-2.3+i*2.5,6.8,2.2,1.1,a,s=.38) for i,a in enumerate(['开场','闯关','见公主','导出'])]
        objects['beats']=[cube('beat marker',-3.4+i*.68,-.5,1.25,.08,.03,.12,'gold') for i in range(16)]
    if mode=='goal':objects['goal']=card('goal note',1.3,7.55,8.8,.95,'做完一支打怪通关视频',s=.43)
    if mode=='collect':
        objects['coins']=[cube('coin',-.9+i*2.6,-1.7,6.35,.24,.08,.38,'gold') for i in range(3)]
        objects['tiles']=[card('asset '+a,0,0,1.3,.7,a,s=.25) for a in ['背景','动作','音效']]
    if mode=='edit':
        objects['bridge']=[cube('bridge repair',.1+i*.6,-.5,4.17,.59,.1,.14,'gold') for i in range(5)]
        objects['idle']=card('idle clip',1.1,6.8,4.2,.8,'这段在发呆…',s=.4)
        objects['gap']=cube('striped unwanted clip',-.1,-.4,2.58,1.5,.03,.24,'muted')
    if mode=='bug':
        objects['bug']=card('error monster',3.1,4.8,1.15,1.1,'!',color='E3A0AD',s=.6)
        objects['caption']=card('misaligned caption',2.6,6.8,4.2,.7,'字幕错位',s=.36)
        objects['undo']=card('undo key',-.4,5.6,2.1,.75,'Ctrl+Z',s=.34)
        objects['stamp']=card('fixed stamp',4.2,7.6,2,.7,'已修正',color='teal',s=.32)
    if mode=='princess':
        princess()
        # Move the inherited native princess into the raised v2 stage.
        pr=bpy.data.objects.get('Princess Peach blocking');pr.location.z=4.2;pr.location.x=5.7
        for x in [5.1,6.9]:cube('castle tower',x,.25,5.7,.65,.1,2.9,'B7B9B4')
        objects['flag']=cube('finish flag',4.4,-.1,7.5,.8,.06,.38,'orange');cube('flag pole',4,-.1,6.2,.04,.05,4.1,'ink')
        objects['notyet']=card('not exported',-3.8,6.8,3,.7,'还没导出呢',s=.34)
    if mode=='export':
        objects['export']=card('export button',5.9,7.65,2.9,.7,'导出成片',color='teal',s=.32)
        objects['file']=card('output file',1.2,6.3,8.4,2.3,'tomcat-adventure.mp4',s=.43)
        objects['delivered']=card('delivery note',3.9,5.3,2.5,.9,'已交付',color='gold',s=.42)
    if mode in ['return','done']:
        objects['file']=card('screen video',3.1,5.1,5.5,1.5,'tomcat-adventure.mp4',s=.31)
        objects['delivered']=card('desktop delivery',5.4,6.7,1.8,.7,'已交付',color='gold',s=.31)
    if s['subtitleMode']=='dialogue':
        objects['sub']=card('dialogue',0,.55,9,.66,s['dialogue'],s=.39)
    # Key every third frame, but render each frame. Blender interpolates native transforms.
    for f in sorted(set(range(1,n+1,3))|{n}):
        t=(f-1)/9;total=(n/9);u=(f-1)/max(1,n-1)
        hx,hz=(4.8,4.2) if roommode else (-4.7,3.52)
        cx,cz=(-3.4,2.35) if roommode else (-1.8,4.2);cs=1;rot=.018*math.sin(t*.65)
        target=(hx+.68,hz+.5)
        if play:play.location.x=lerp(-5.8,6.8,u)
        if mode=='desk':
            rot=.09*ease(t,3,7)-.07*ease(t,7,9)+.025*ease(t,12,16);size(objects['thought'],ease(t,7,9))
        if mode in ['thought','emerge']:
            size(objects['thought'],ease(t,0,3) if mode=='thought' else 1)
            if mode=='thought':target=(lerp(hx+.68,1.3,ease(t,11,16)),lerp(hz+.5,7.8,ease(t,11,16)))
            else:
                p=ease(t,2,6);hx=lerp(4.8,-.8,p);hz=lerp(4.2,2.4,p)+1.3*math.sin(math.pi*p)
                q=ease(t,6,9);target=(lerp(hx+.68,.9,q),lerp(hz+.5,7.8,q));objects['thought'].rotation_euler.y=-.03*ease(t,9,12)
        if mode=='portal':
            p=ease(t,0,4);cs=lerp(1,.34,p);q=ease(t,4,13);cx=lerp(-3.4,3.1,q);cz=lerp(2.35,4.1,q)+.8*math.sin(math.pi*q)
            hx,hz=(-.8,2.4);target=(cx+1.9*cs,cz+3.8*cs)
            xy(objects['selection'],cx,cz,-1.8);size(objects['selection'],cs)
            z=ease(t,12,16);sc.camera.data.ortho_scale=lerp(18,7.2,z);sc.camera.location.x=3.3*z;sc.camera.location.z=lerp(5,5.05,z)
        if mode=='branch':
            p=ease(t,2,5);target=(lerp(hx+.68,3.9,p),lerp(hz+.5,5.65,p));objects['enter'].scale.z=1-.18*math.sin(math.pi*ease(t,5,7));size(objects['branch'],ease(t,6,9))
        if mode=='editor':
            # native collection reveal from bottom to top
            for i,c in enumerate(clips):c.scale.x=max(.001,ease(t,5+i//4,7+i//4))
            target=(lerp(-4,6,ease(t,2,12)),lerp(8.5,3,ease(t,2,12)))
        if mode=='skills':
            p=ease(t,1,6);tx=lerp(-1,-6.7,p);tz=lerp(6.1,6.6,p)+.65*math.sin(math.pi*p);xy(objects['held'],tx,tz,-2.9);size(objects['held'],1-ease(t,6,7))
            target=(tx+.4,tz+.8)
            for i,c in enumerate(objects['cards']):
                a=8+i*2.1;q=ease(t,a,a+1.7);c.location.z=lerp(7,5.95,q);c.rotation_euler.y=.06*math.sin(math.pi*q)
                if a<=t<=a+1.7:target=(c.location.x+.7,c.location.z+.2)
            cx=6.25;rot=-.035
        if mode=='script':
            for i,c in enumerate(objects['cards']):size(c,ease(t,3+i*2,4+i*2))
            for i,c in enumerate(objects['beats']):c.scale.z=max(.001,ease(t,i*.75,i*.75+.7))
            target=(lerp(-3.4,6.8,ease(t,0,14)),6.75)
        if mode=='goal':
            size(objects['goal'],ease(t,0,3));p=ease(t,4,8);cx=lerp(-4,-1.8,p);cz=lerp(6,5,p)-.8*ease(t,8,10);target=(cx+.8,cz+1.8)
            if t>10:target=(hx+.7,hz+.5)
            rot=-.09*ease(t,12,13)+.09*ease(t,15,16);cx+=2.0*ease(t,16,20)
        if mode=='collect':
            cx=lerp(-2.4,5.8,ease(t,2,18));cz=4.2+1.25*abs(math.sin(math.pi*max(0,min(3,(t-3)/4))))
            for i,(coin,tile) in enumerate(zip(objects['coins'],objects['tiles'])):
                a=6+i*4;p=ease(t,a,a+2.6);size(coin,1-ease(t,a,a+.5));size(tile,ease(t,a,a+.4)*(1-ease(t,a+2.6,a+3)))
                tx=lerp(-.9+i*2.6,-6.65,p);tz=lerp(6.35,6.7,p)+.7*math.sin(math.pi*p);xy(tile,tx,tz,-2.9)
                if a<=t<=a+2.6:target=(tx+.45,tz+.12)
            size(marks[0],ease(t,18,19))
        if mode=='edit':
            cut=ease(t,8,12);objects['gap'].scale.x=max(.001,1-cut)
            # One shared cut scalar drives clip trim, following clip and actual gap closure.
            clips[1].scale.x=1-.5*cut;clips[2].location.x=1.8-1.45*cut
            for i,b in enumerate(objects['bridge']):b.scale.x=max(.001,cut);b.location.z=4.17-.55*(1-cut)
            size(objects['idle'],ease(t,3,4)*(1-ease(t,11,12)))
            target=(lerp(hx+.7,.9,ease(t,4,8))-1.45*cut,2.6)
            cx=-.65+4.5*ease(t,14,19);cz=4.2+1.3*math.sin(math.pi*ease(t,15,18));size(marks[1],ease(t,19,20))
        if mode=='bug':
            fix=ease(t,8,12);objects['caption'].rotation_euler.y=.14*(1-fix);objects['caption'].location.z=6.8-.45*(1-fix)
            target=(lerp(hx+.7,-.4,ease(t,4,8)),lerp(hz+.5,5.6,ease(t,4,8)))
            size(objects['stamp'],ease(t,12,13));size(objects['bug'],1-ease(t,16,17));cx=lerp(-1.8,3.1,ease(t,11,16))+1.8*ease(t,17,20);cz=4.2+1.7*math.sin(math.pi*ease(t,12,16))
        if mode=='princess':
            cx=lerp(-1.8,3.6,ease(t,0,6));cz=4.2+.8*math.sin(math.pi*ease(t,0,4));objects['flag'].location.z=lerp(7.5,5,ease(t,2,6));size(objects['notyet'],ease(t,12,13));target=(-6.9,4.59) if t>12 else target
        if mode=='export':
            p=ease(t,0,3);target=(lerp(hx+.7,5.9,p),lerp(hz+.5,7.65,p));size(objects['file'],ease(t,3,7));size(objects['delivered'],ease(t,7,9));size(marks[2],ease(t,8,9))
            for c in clips:c.scale.x=max(.001,1-.94*ease(t,3,6))
            objects['file'].location.z+=0  # explicit deterministic position below
            objects['file'].location.z=6.3+.25*ease(t,9,12)
        if mode=='return':
            sc.camera.data.ortho_scale=lerp(7.2,18,ease(t,0,6));sc.camera.location.x=lerp(3.3,0,ease(t,0,6));sc.camera.location.z=lerp(5.05,5,ease(t,0,6))
            size(objects['delivered'],ease(t,6,8));target=(5.4,6.7) if t<9 else (6.6,5.4+.04*math.sin(t*5))
        if mode=='done':rot=.05*math.sin(math.pi*ease(t,6,9))+.02*ease(t,9,12)
        if 'sub' in objects:size(objects['sub'],ease(t,7,8) if mode=='princess' else ease(t,2,3))
        xy(cat,cx,cz,-1.6);size(cat,cs);cat.rotation_euler.y=rot
        xy(helper,hx,hz,-2.4);helper.rotation_euler.y=-.035*math.sin(t)*float(2<t<total-2)
        arm_set(arm,(hx+.45,hz+.5),target,f)
        if mode in ['skills','script','edit','bug']:
            # Small, motivated camera move; outer stage stays inside the safe region.
            focus=ease(t,2,5)*(1-ease(t,total-4,total))
            sc.camera.data.ortho_scale=18-.5*focus
            sc.camera.location.x=.12*focus
        # Baking all transform-bearing objects keeps .blend editable and seek independent.
        for ob in [cat,helper,arm[2],sc.camera]+([play] if play else [])+marks+clips+list(objects.get('cards',[]))+list(objects.get('coins',[]))+list(objects.get('tiles',[]))+list(objects.get('bridge',[]))+list(objects.get('beats',[]))+[v for v in objects.values() if isinstance(v,bpy.types.Object)]:
            key(ob,f,loc=ob.location.copy(),scale=ob.scale.copy(),rot=ob.rotation_euler.copy())
        sc.camera.data.keyframe_insert('ortho_scale',frame=f)
    sc['planRevision']=PLAN['planRevision'];sc['sourceShot']=s['id'];sc['globalStart']=s['startFrame'];sc['status']='v2 animated draft; sprites, no voice or full rig'
    for d in ['scenes','frames','previews','receipts']:(OUT/d).mkdir(parents=True,exist_ok=True)
    sc.frame_set(max(1,round(n*.62)));bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'scenes'/f"{s['id']}.blend"))
    sc.render.filepath=str(OUT/'previews'/f"{s['id']}.png");bpy.ops.render.render(write_still=True)
    if opt.animate:
        fd=OUT/'frames'/s['id'];fd.mkdir(exist_ok=True);sc.render.filepath=str(fd/'frame-');bpy.ops.render.render(animation=True)
    report={'shotId':s['id'],'planRevision':PLAN['planRevision'],'animationRendered':opt.animate,'frameStep':opt.frame_step,'frames':n,'width':opt.width,'height':round(opt.width*9/16),'blender':bpy.app.version_string,'sourceHashes':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [EP/'shots.json',EP/'script.md',Path(__file__),_base,MASTER,FONT_PATH]},'limitations':['Whole sprite cat, not separated limb/badge rig','No dialogue voice','Some scripted secondary acting remains simplified'],'secondsSpent':time.time()-started}
    (OUT/'receipts'/f"{s['id']}.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print('SHOT_DONE',s['id'],flush=True)

for s in PLAN['shots']:
    if opt.shot=='all' or s['id'] in opt.shot.split(','):
        started=time.time();make(s)
