"""Independent Blender 4.5 previsualization. Native sets, cameras and keyframes.

Character sprites are explicit 2.5D blocking assets, NOT a completed 3D rig.
Read the one canonical shots.json; never derive final timing from a duplicate table.
"""
import bpy, sys, math, json, hashlib, argparse
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[3]
EP=ROOT/"episodes/ai-video-game-editing"
OUT=ROOT/"out/ai-video-game-editing/blender"
PLAN=json.loads((EP/"shots.json").read_text(encoding="utf-8"))
MASTER=ROOT/"public/brand/tomcat/tomcat-pixel-master-v3-ant-logo.png"
SLEEP=EP/"assets/characters/tomcat-sleepy-v1.png"
FONT_PATH=Path("C:/Windows/Fonts/msyhbd.ttc")
args=argparse.ArgumentParser()
args.add_argument("--shot",default="all")
args.add_argument("--animate",action="store_true")
args.add_argument("--width",type=int,default=960)
args.add_argument("--samples",type=int,default=8)
args.add_argument("--frame-step",type=int,default=1)
opt=args.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
COL={"night":"101B38","panel":"1D2B45","edge":"344867","blue":"45BDF4","white":"FFF4D5","orange":"DB805C","green":"43C898","purple":"856BE8","pink":"E781AD","brick":"C67549","dark":"182031","gold":"F5D15C"}
MATS={}
def rgb(h):
    h=COL.get(h,h)
    vals=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in vals)
def material(c):
    if c in MATS:return MATS[c]
    m=bpy.data.materials.new(c);m.diffuse_color=(*rgb(c),1);m.use_nodes=True
    ns=m.node_tree.nodes;ns.clear()
    em=ns.new("ShaderNodeEmission");em.inputs["Color"].default_value=(*rgb(c),1)
    out=ns.new("ShaderNodeOutputMaterial");m.node_tree.links.new(em.outputs[0],out.inputs[0])
    MATS[c]=m;return m
def cube(name,x,y,z,w,d,h,c,parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z))
    o=bpy.context.object;o.name=name;o.dimensions=(w,d,h)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material(c))
    if parent:o.parent=parent
    return o
def empty(name,x=0,y=0,z=0):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=(x,y,z);return o
def text(body,x,z,size=.3,c="white",y=-1.7,align="LEFT"):
    cv=bpy.data.curves.new("Text "+body,"FONT");cv.body=body;cv.size=size;cv.align_x=align
    if FONT_PATH.exists():cv.font=bpy.data.fonts.load(str(FONT_PATH),check_existing=True)
    o=bpy.data.objects.new("Label "+body,cv);bpy.context.collection.objects.link(o);o.location=(x,y,z);o.rotation_euler=(math.pi/2,0,0);cv.materials.append(material(c))
    return o
def sprite(name,path,x,z,height,y=-.9):
    root=empty(name,x,y,z)
    image=bpy.data.images.load(str(path),check_existing=True)
    ratio=image.size[0]/image.size[1]
    mesh=bpy.data.meshes.new(name+" plane")
    mesh.from_pydata([(-height*ratio/2,0,0),(height*ratio/2,0,0),(height*ratio/2,0,height),(-height*ratio/2,0,height)],[],[(0,1,2,3)])
    mesh.uv_layers.new()
    for l,uv in zip(mesh.uv_layers.active.data,[(0,0),(1,0),(1,1),(0,1)]):l.uv=uv
    o=bpy.data.objects.new(name+" sprite",mesh);bpy.context.collection.objects.link(o);o.parent=root
    m=bpy.data.materials.new(name+" RGBA");m.use_nodes=True
    ns=m.node_tree.nodes;ns.clear();out=ns.new("ShaderNodeOutputMaterial");tex=ns.new("ShaderNodeTexImage");tex.image=image;tex.interpolation="Closest"
    transparent=ns.new("ShaderNodeBsdfTransparent");emit=ns.new("ShaderNodeEmission");mix=ns.new("ShaderNodeMixShader")
    m.node_tree.links.new(tex.outputs["Color"],emit.inputs["Color"]);m.node_tree.links.new(tex.outputs["Alpha"],mix.inputs[0])
    m.node_tree.links.new(transparent.outputs[0],mix.inputs[1]);m.node_tree.links.new(emit.outputs[0],mix.inputs[2]);m.node_tree.links.new(mix.outputs[0],out.inputs[0])
    m.surface_render_method="DITHERED";o.data.materials.append(m)
    return root
def key(o,frame,loc=None,scale=None,rot=None):
    if loc is not None:o.location=loc;o.keyframe_insert("location",frame=frame)
    if scale is not None:o.scale=scale;o.keyframe_insert("scale",frame=frame)
    if rot is not None:o.rotation_euler=rot;o.keyframe_insert("rotation_euler",frame=frame)
def pop(o,frame):
    key(o,max(1,frame-3),scale=(.001,.001,.001));key(o,frame,scale=(1.1,1.1,1.1));key(o,frame+3,scale=(1,1,1))
def helper(x,z,scale=.7):
    r=empty("Claude orange helper",x,-1.1,z)
    cube("helper body",0,0,.45,1.0,.35,.7,"orange",r)
    for sx in (-1,1):
        cube("eye",sx*.22,-.195,.50,.12,.025,.20,"dark",r)
        cube("arm",sx*.65,0,.30,.32,.25,.20,"orange",r)
        cube("claw",sx*.79,0,.46,.15,.25,.35,"orange",r)
    for xx in (-.33,-.11,.11,.33):cube("leg",xx,0,.04,.13,.22,.26,"orange",r)
    r.scale=(scale,)*3
    return r
def panel(name,x,z,w,h,c="panel",y=0):
    cube(name+" border",x,y,z,w+.10,.20,h+.10,"edge")
    return cube(name,x,y-.13,z,w,.12,h,c)
def setup(shot):
    global MATS
    bpy.ops.wm.read_factory_settings(use_empty=True);MATS={}
    sc=bpy.context.scene;sc.name=shot["id"]+" "+shot["title"]
    sc.render.engine="BLENDER_EEVEE_NEXT";sc.eevee.taa_render_samples=opt.samples
    sc.render.resolution_x=opt.width;sc.render.resolution_y=round(opt.width*9/16);sc.render.resolution_percentage=100
    sc.render.fps=30;sc.frame_start=1;sc.frame_end=shot["endFrame"]-shot["startFrame"];sc.frame_step=opt.frame_step
    sc.world=bpy.data.worlds.new("World");sc.world.color=(.16,.16,.16)
    sc.view_settings.view_transform="Standard"
    bpy.ops.object.camera_add(location=(0,-25,5.5));cam=bpy.context.object
    cam.rotation_euler=(Vector((0,0,4.5))-cam.location).to_track_quat("-Z","Y").to_euler();cam.data.type="ORTHO";cam.data.ortho_scale=18;sc.camera=cam
    for pos,power,size in [((0,-10,10),1500,12),((-6,-3,6),450,8)]:
        bpy.ops.object.light_add(type="AREA",location=pos);light=bpy.context.object;light.data.energy=power;light.data.shape="DISK";light.data.size=size
        light.rotation_euler=(Vector((0,0,3))-light.location).to_track_quat("-Z","Y").to_euler()
    cube("backdrop",0,3,4.5,22,.3,13,"night")
    text(shot["id"]+" / "+shot["title"],-8.2,8.72,.24,"white",y=-2)
    text("BLENDER  /  2.5D BLOCKING  /  NOT FINAL",8.1,.02,.16,"blue",align="RIGHT",y=-2)
    for b in range(0,shot["endBeat"]-shot["startBeat"]):sc.timeline_markers.new("beat "+str(b+1),frame=b*9+1)
    return sc
def desk(shot):
    end=bpy.context.scene.frame_end
    # Native room furniture, deliberately not a full background image.
    panel("window",-5.7,6.0,3.4,3.0,"panel",y=2)
    for i in range(6):
        cube("night building",-7+i*.52,1.7,5.1+(i%3)*.15,.43,.2,.9+(i%3)*.3,"edge")
        cube("lit window",-7+i*.52,1.55,5.3,.10,.05,.12,"gold")
    cube("moon",-4.8,1.5,6.8,.55,.10,.55,"white")
    cube("desk",-0.1,.1,1.7,15.4,3,.22,"836451")
    for xx in (-6.2,6.0):cube("desk leg",xx,.2,.65,.22,1.1,2,"544A49")
    panel("monitor",3.2,4.45,6.3,3.6,"panel",y=.4)
    cube("monitor stand",3.2,.3,2.3,.4,.55,.7,"edge")
    cube("stand foot",3.2,.2,1.95,2,.65,.13,"edge")
    cube("keyboard",2.5,-1.1,1.9,3.7,.9,.12,"dark")
    for k in range(14):cube("key",.9+k*.25,-1.5,2,.17,.15,.05,"edge")
    cube("cup",-6.3,-.9,2.12,.6,.6,.7,"blue")
    cube("lamp post",-7,.5,3.0,.12,.12,2.4,"gold")
    cube("lamp shade",-6.65,.5,4.1,.9,.6,.32,"gold")
    text("02:37",5.4,2.14,.35,"blue",y=-1.2)
    mode=shot["scene"]
    cat=sprite("Tomcat at desk",SLEEP if mode!="portal" else MASTER,-3.6,1.88,3.65)
    key(cat,1,rot=(0,0,0));key(cat,25,rot=(0,.07,0));key(cat,49,rot=(0,0,0));key(cat,end,rot=(0,.02,0))
    h=helper(4.3,3.4,.70)
    text("Claude",1.0,5.35,.35,"orange",y=-.2)
    if mode in ("thought","emerge"):
        panel("thought bubble",-2.5,6.55,6.1,1.3,"white",y=-.8)
        text("做个汤姆猫打怪视频…",-5.2,6.38,.36,"dark",y=-1.1)
        for i in range(3):
            o=cube("thought pixel",-3.6+i*.15,-1,5.45+i*.25,.12+i*.03,.1,.12+i*.03,"white");pop(o,1+i*18)
    if mode=="emerge":
        key(h,1,loc=(4.3,-1.1,3.4));key(h,28,loc=(1.2,-1.7,5.2));key(h,46,loc=(-.6,-1.7,2.1));key(h,end,loc=(-.6,-1.7,2.1))
    if mode=="portal":
        key(cat,1,loc=(-3.6,-.9,1.88),scale=(1,1,1))
        key(cat,42,loc=(-1.5,-.9,3.2),scale=(.4,.4,.4))
        key(cat,end,loc=(3.1,-.1,3.2),scale=(.3,.3,.3))
        cam=bpy.context.scene.camera;cam.data.ortho_scale=18;cam.data.keyframe_insert("ortho_scale",frame=1);cam.data.ortho_scale=8;cam.data.keyframe_insert("ortho_scale",frame=end)
        key(cam,1,loc=cam.location.copy());key(cam,end,loc=(3.1,-25,4.9))
    if mode in ("return","done"):
        text("tomcat-adventure.mp4",1,4.3,.30,"green",y=-.1)
        text("视频制作完毕",1,3.6,.40,"white",y=-.1)
    if mode=="desk":text("如果 AI 能帮我……",-5.2,6.2,.43,"white",y=-1)
    return cat,h
def terrain():
    cube("sky",1.6,1.8,5.4,13.6,.1,6.0,"5392BA")
    for x in (-3,1,5):
        cube("cloud",x,1.3,7.7,1.9,.12,.32,"white")
        cube("cloud top",x-.2,1.3,7.96,.9,.12,.26,"white")
    for i in range(20):
        x=-4.4+i*.62
        cube("brick ground",x,.5,2.69,.60,.8,.55,"brick")
        cube("grass",x,.5,3.0,.60,.85,.10,"green")
    for x in (-1.8,2.0,5.0):
        cube("pipe",x,.75,3.5,.7,.7,1,"green");cube("pipe lip",x,.75,4.05,1,.9,.2,"48AD77")
    for i in range(4):
        cube("platform",-.9+i*1.4,0,4.1+(i%2)*.35,1.05,.5,.35,"brick")
        cube("coin",-.9+i*1.4,-.1,5.25+(i%2)*.35,.23,.17,.39,"gold")
def timeline(shot):
    panel("timeline",1.6,1.4,13.5,2.5,"panel",y=.4)
    for row,(label,col) in enumerate([("V1 游戏","blue"),("V2 角色","orange"),("A1 BGM","purple"),("A2 音效","green")]):
        z=2.17-row*.48;text(label,-4.65,z,.19,"white",y=-1.6)
        for i in range(7):
            cube("clip "+label,-2.5+i*1.45,-.15,z+.05,1.35,.08,.29,col)
    play=cube("playhead",-3.2,-.6,1.53,.045,.12,2.2,"gold")
    key(play,1,loc=(-3.2,-.6,1.53));key(play,bpy.context.scene.frame_end,loc=(7,-.6,1.53))
def shelf(shot):
    panel("asset shelf",-6.4,4.6,3.2,7.3,"panel",y=.2)
    text("素材 / ASSETS",-7.8,7.6,.26,"blue")
    sprite("library thumbnail",MASTER,-6.4,5.8,1.45,y=-.7)
    text("汤姆猫",-7.2,5.45,.24)
    text("本期目标",-7.8,4.6,.30,"gold")
    progress={"collect":1,"edit":2,"bug":2,"princess":2,"export":3}.get(shot["scene"],0)
    for i,line in enumerate(["镜头齐","声画合拍","成片导出"]):
        text(("■ " if progress>i else "□ ")+line,-7.8,4.0-i*.52,.28,"green" if progress>i else "white")
    text("做完打怪通关视频",-7.8,2.12,.23,"white")
def princess():
    r=empty("Princess Peach blocking",6.1,-.5,3.02)
    for j,w in enumerate([1.2,1,.75]):cube("pink dress",0,0,.17+j*.3,w,.5,.3,"pink",r)
    cube("hair",0,0,1.55,.8,.45,.78,"gold",r)
    cube("face",0,-.26,1.51,.48,.08,.5,"FBDAB1",r)
    for x in (-.13,.13):cube("eye",x,-.31,1.55,.07,.02,.1,"blue",r)
    cube("crown",0,0,2.08,.6,.25,.18,"gold",r)
    for x in (-.2,0,.2):cube("crown point",x,0,2.22,.12,.25,.18,"gold",r)
    for x in (-.6,.6):cube("hand",x,0,1,.2,.2,.3,"white",r)
    return r
def game(shot):
    mode=shot["scene"];end=bpy.context.scene.frame_end
    terrain();timeline(shot);shelf(shot)
    cat=sprite("Tomcat game",MASTER,-2.6,3.08,2.0)
    h=helper(-3.8,3.08,.7)
    key(h,1,loc=(-3.8,-1.1,3.08));key(h,end,loc=(-2.9,-1.1,3.2))
    if mode in ("collect","edit","bug","princess","goal"):
        for k in range(0,end+1,9):
            u=k/end;x=-2.6+6*u
            z=3.08+abs(math.sin(u*3*math.pi))*1.6 if mode!="goal" else 3.08+max(0,1-k/81)*1.5
            key(cat,max(1,k),loc=(x,-.9,z))
    if mode=="branch":
        panel("terminal",1.8,6.1,10.9,2.6,"dark",y=-1.1)
        text("$ git switch -c",-3.2,6.62,.39,"green",y=-1.4)
        text("  episode/04-ai-video-game-editing",-3.2,5.91,.30,"white",y=-1.4)
        text("新分支已创建",-3.2,5.3,.29,"orange",y=-1.4)
    if mode=="skills":
        for i,(a,b) in enumerate([("blender-scene","搭场景"),("beat-map","对节拍"),("render-qc","查成片")]):
            o=panel("skill "+a,-1.8+i*3.2,6.55,2.9,1.45,"panel",y=-1)
            text(a,-3.05+i*3.2,6.74,.27,"orange",y=-1.4)
            text(b,-3.05+i*3.2,6.15,.31,"white",y=-1.4);pop(o,1+i*27)
    if mode=="script":
        for i,a in enumerate(["开场","闯关","见公主","导出"]):
            o=panel("script beat",-2.3+i*2.5,6.4,2.2,1.2,"white",y=-1)
            text(a,-3.05+i*2.5,6.24,.33,"dark",y=-1.4);pop(o,1+i*27)
    if mode=="goal":text("开始制作！",-1,6.6,.65,"white",y=-1.5)
    if mode=="edit":
        for i in range(3):
            o=cube("repair bridge",1+i*.55,-.3,3.15,.52,.4,.2,"gold");pop(o,46+i*27)
        text("剪辑铺路",-1.5,6.9,.4)
    if mode=="bug":
        o=cube("error monster",3.6,-.5,3.55,1.4,.6,1.1,"purple")
        text("!",3.42,3.48,.65,"white",y=-.85)
        key(o,1,scale=(1,1,1));key(o,117,scale=(1,1,1));key(o,128,scale=(.001,.001,.001))
        text("字幕错位",-1,6.7,.38,"pink")
    if mode=="princess":
        for xx in (5.4,7.0):
            cube("castle tower",xx,.75,4.65,.65,.65,3.25,"A2AEC8")
            for k in range(3):cube("battlement",xx-.24+k*.24,.75,6.35,.16,.65,.25,"A2AEC8")
        princess()
        cube("flag pole",4.4,.5,5.1,.08,.08,4.2,"white")
        flag=cube("finish flag",4.9,.5,6.8,.95,.08,.5,"orange")
        key(flag,1,loc=(4.9,.5,6.8));key(flag,46,loc=(4.9,.5,4.0))
    if mode=="export":
        panel("file",1.9,5.7,8.4,2.5,"panel",y=-1.1)
        text("tomcat-adventure.mp4",-1.9,5.83,.40,"white",y=-1.4)
        text("成片导出  已完成",-1.9,5.16,.38,"green",y=-1.4)
    return cat,h
def render_one(shot):
    sc=setup(shot)
    if shot["scene"] in ("desk","thought","emerge","portal","return","done"):desk(shot)
    else:game(shot)
    if shot["subtitleMode"]=="dialogue":
        panel("subtitle backing",0,.57,9.5,.64,"dark",y=-2)
        text(shot["dialogue"],0,.45,.42,"white",y=-2.3,align="CENTER")
    sc["production_status"]="BLOCKING: sprites not fully rigged; action polish, lip sync and audio QC pending"
    sc["source_shot_id"]=shot["id"];sc["global_start_frame"]=shot["startFrame"]
    sc["source_bpm"]=PLAN["music"]["bpm"]
    sc.frame_set(round(sc.frame_end*.52))
    (OUT/"scenes").mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"scenes"/(shot["id"]+".blend")))
    bpy.ops.file.make_paths_relative()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"scenes"/(shot["id"]+".blend")))
    preview=EP/"assets/previews";preview.mkdir(parents=True,exist_ok=True)
    sc.render.image_settings.file_format="PNG";sc.render.filepath=str(preview/(shot["id"]+".png"))
    bpy.ops.render.render(write_still=True)
    if opt.animate:
        frames=OUT/"frames"/shot["id"];frames.mkdir(parents=True,exist_ok=True)
        sc.render.filepath=str(frames/"frame-")
        bpy.ops.render.render(animation=True)
    return {"shotId":shot["id"],"blend":str((OUT/"scenes"/(shot["id"]+".blend")).relative_to(ROOT)),"preview":str((preview/(shot["id"]+".png")).relative_to(ROOT)),"frame":sc.frame_current,"animationRendered":opt.animate,"renderStatus":"blocking-preview"}
selected=[s for s in PLAN["shots"] if opt.shot in ("all",s["id"])]
if not selected:raise ValueError("Unknown shot: "+opt.shot)
receipts=[render_one(s) for s in selected]
report={"status":"blocking-previews-not-final-film","blender":bpy.app.version_string,"width":opt.width,"height":round(opt.width*9/16),"fps":30,"frameStep":opt.frame_step,"sourceHashes":{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [EP/"shots.json",EP/"script.md",Path(__file__),MASTER]},"shots":receipts,"limitations":["2.5D sprite blocking, not final rigged character animation","No dialogue voice","Keyframes are initial motion blocking, not every scripted action implemented","No final music beat/listening QC","No old Remotion framework used"]}
(EP/"render"/("blender-"+opt.shot+"-receipt.json")).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
