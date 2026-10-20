import * as T from 'three';
const TAU=Math.PI*2,V=(...p)=>new T.Vector3(...p);

// Bevels stay inside the stated envelope. These are visual manufacturing
// details, not prescriptions of OEM fits, fasteners, threads or surface finish.
export function machinedRingGeometry(inner,outer,height,bevel=.004,segments=96){
 const b=Math.min(bevel,(outer-inner)*.2,height*.2),y=height/2;
 const profile=[[inner+b,-y],[outer-b,-y],[outer,-y+b],[outer,y-b],[outer-b,y],[inner+b,y],[inner,y-b],[inner,-y+b],[inner+b,-y]].map(p=>new T.Vector2(...p));
 return new T.LatheGeometry(profile,segments);
}
export function precisionBoxGeometry(size,bevel=.015){
 const [w,h,d]=size,b=Math.min(bevel,w*.16,h*.16,d*.16),s=new T.Shape();
 s.moveTo(-w/2+b,-h/2+b);s.lineTo(w/2-b,-h/2+b);s.lineTo(w/2-b,h/2-b);s.lineTo(-w/2+b,h/2-b);s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:2,steps:1});g.translate(0,0,-d/2+b);return g;
}
export function addPrecisionDetails(api,g){
 const {mesh,box,cyl,torus,rod,pipe,bolts,meshes,zsurf,materials:m}=api;
 const bevel=(parent,size,pos,mat=m.white,rot=null)=>mesh(precisionBoxGeometry(size),mat,parent,pos,rot);
 function instances(parent,geometry,mat,poses){const im=new T.InstancedMesh(geometry,mat.clone(),poses.length),d=new T.Object3D();poses.forEach((p,i)=>{d.position.set(...p.position);d.rotation.set(...(p.rotation||[0,0,0]));d.scale.set(...(p.scale||[1,1,1]));d.updateMatrix();im.setMatrixAt(i,d.matrix);});im.castShadow=im.receiveShadow=true;parent.add(im);meshes.push(im);return im;}
 function ring(parent,ri,ro,h,pos,mat=m.steel,axis='y'){const geo=machinedRingGeometry(ri,ro,h);if(axis==='z')geo.rotateX(Math.PI/2);if(axis==='x')geo.rotateZ(Math.PI/2);return mesh(geo,mat,parent,pos);}
 function plate(parent,text,size,pos,rot=[0,0,0]){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#1e3039';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#97aeb5';ctx.lineWidth=3;ctx.strokeRect(9,9,494,110);ctx.fillStyle='#d6e3e6';ctx.font='500 42px Segoe UI';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const mat=new T.MeshStandardMaterial({map:tex,metalness:.5,roughness:.4});const p=mesh(new T.PlaneGeometry(...size),mat,parent,pos,rot);p.name='Identification_'+text.replace(/[^a-zA-Z0-9]/g,'_');return p;}
 // Foundation shoes, anchor seats and a recessed, sealed maintenance door.
 for(let i=0;i<3;i++){const a=i*TAU/3+Math.PI/6,x=Math.cos(a)*1.86,z=Math.sin(a)*1.86;for(const s of [-1,1]){const xx=x+s*.23*Math.sin(a),zz=z-s*.23*Math.cos(a);ring(g.pedestal,.045,.10,.025,[xx,.315,zz],m.rim);cyl(g.pedestal,.063,.085,[xx,.36,zz],m.steel,.063,null,false,6);cyl(g.pedestal,.035,.045,[xx,.415,zz],m.steel,.035,null,false,18);}}
 bevel(g.pedestal,[.67,.70,.035],[0,.95,1.678],m.seal);bevel(g.pedestal,[.60,.63,.035],[0,.95,1.70],m.white);bevel(g.pedestal,[.045,.16,.055],[.20,.97,1.744],m.steel);
 for(const y of [.74,1.14])bevel(g.pedestal,[.06,.12,.07],[-.28,y,1.71],m.rim);
 plate(g.pedestal,'AEM  /  12 m',[.44,.11],[0,1.38,1.515],[-.4,0,0]);
 // Bearing races, seals and accessible grease-line envelopes.
 for(const y of [1.80,2.36])torus(g.bearing,1.35,.016,[0,y,0],m.seal,[Math.PI/2,0,0]);
 for(let i=0;i<4;i++){const a=i*TAU/4+.3,x=1.43*Math.cos(a),z=1.43*Math.sin(a);cyl(g.bearing,.025,.09,[x,2.38,z],m.gold,.025,null,false,8);pipe(g.bearing,[[x,2.38,z],[x,2.47,z],[x*1.06,2.5,z*1.06]],.012,m.steel);}
 // Rotor follows AZ; distributed stators remain on the fixed base.
 ring(g.rotorAZ,1.46,1.58,.23,[0,.26,0],m.steel);
 const magnetPos=[];for(let i=0;i<48;i++){const a=TAU*i/48;magnetPos.push({position:[1.582*Math.cos(a),.26,1.582*Math.sin(a)],rotation:[0,-a,0]});}instances(g.rotorAZ,new T.BoxGeometry(.022,.17,.13),m.dark,magnetPos);
 bolts(g.rotorAZ,1.5,48,[0,.39,0],'y',.62);
 for(const s of [-1,1]){const rotor=api.part('A04',g.elevation,[s*1.2,0,0]);ring(rotor,.335,.455,.035,[s*2.415,0,0],m.rim,'x');bolts(rotor,.395,16,[s*2.44,0,0],'x',.55);}
 // Yoke cover plates, seal grooves and machined pivot interfaces.
 for(const s of [-1,1]){
  ring(g.yoke,.325,.48,.035,[s*2.275,3.5,0],m.rim,'x');torus(g.yoke,.36,.012,[s*2.30,3.5,0],m.seal,[0,Math.PI/2,0]);
  bevel(g.yoke,[.045,.62,.58],[s*2.225,1.65,.12],m.seal);bevel(g.yoke,[.05,.55,.51],[s*2.255,1.65,.12],m.white);
  for(const yy of [1.44,1.86])for(const zz of [-.07,.31])cyl(g.yoke,.025,.035,[s*2.29,yy,zz],m.steel,.025,[0,0,Math.PI/2],false,6);
 }
 for(const x of [-1.65,-.55,.55,1.65]){bevel(g.yoke,[.84,.66,.045],[x,.85,-2.055],m.white);bevel(g.yoke,[.045,.13,.025],[x+.25,.87,-2.09],m.dark);}
 // Rear BUS access covers and sector seams, contained behind the optical surface.
 const busCoverPos=[];
 for(let i=0;i<24;i++){const a=TAU*(i+.5)/24,r=5.4;busCoverPos.push({position:[r*Math.cos(a),r*Math.sin(a),zsurf(r)-.875],rotation:[Math.PI/2,0,0]});}
 instances(g.bus,new T.CylinderGeometry(.10,.10,.018,32),m.rim,busCoverPos);
 const coverScrews=[];for(const p of busCoverPos)for(let i=0;i<4;i++){const a=TAU*i/4;coverScrews.push({position:[p.position[0]+.075*Math.cos(a),p.position[1]+.075*Math.sin(a),p.position[2]-.013],rotation:[Math.PI/2,0,0]});}instances(g.bus,new T.CylinderGeometry(.013,.013,.012,6),m.steel,coverScrews);
 // Local hardware beneath each panel: seating washers, jam nuts, bellows,
 // and a visible helical thread. Counts and thread pitch are illustrative.
 const positions=api.adjusterPositions;
 const axialPos=(dz,rotation=[Math.PI/2,0,0])=>positions.map(([x,y,z])=>({position:[x,y,z+dz],rotation}));
 instances(g.adjusters,machinedRingGeometry(.036,.074,.018),m.steel,axialPos(-.065));
 instances(g.adjusters,new T.CylinderGeometry(.056,.056,.035,6),m.gold,axialPos(-.21));
 const bellowsPoints=[];for(let i=0;i<=20;i++)bellowsPoints.push(new T.Vector2(i===0||i===20?.045:i%2?.061:.049,-.055+i*.0055));
 instances(g.adjusters,new T.LatheGeometry(bellowsPoints,20),m.seal,axialPos(-.12));
 const thread=[];for(let i=0;i<=96;i++){const a=i/96*TAU*8;thread.push(V(.035*Math.cos(a),-.09+i/96*.18,.035*Math.sin(a)));}const threadGeo=new T.TubeGeometry(new T.CatmullRomCurve3(thread),144,.0025,4,false);instances(g.adjusters,threadGeo,m.rim,axialPos(-.13));
 // Four quadripod clevises and pivot fasteners.
 for(let i=0;i<4;i++){const a=Math.PI/4+i*TAU/4,x=5.75*Math.cos(a),y=5.75*Math.sin(a),z=zsurf(5.75)+.04;for(const s of [-1,1])bevel(g.quadripod,[.06,.32,.26],[x+s*.12,y,z],m.rim,[0,0,a]);rod(g.quadripod,[x-.2,y,z+.04],[x+.2,y,z+.04],.047,m.steel);bolts(g.quadripod,.085,4,[x,y,z+.16],'z',.6);}
 // Secondary rear ribs and a machined mounting interface, behind the optical face.
 ring(g.secondary,.115,.26,.035,[0,0,5.035],m.rim,'z');bolts(g.secondary,.205,12,[0,0,5.06],'z',.45);
 for(let i=0;i<8;i++){const a=TAU*i/8;rod(g.secondary,[.12*Math.cos(a),.12*Math.sin(a),5.035],[.32*Math.cos(a),.32*Math.sin(a),4.995],.012,m.steel);}
 // Hexapod actuator collars, spherical joints and fixed-end boots.
 for(let i=0;i<api.hexLegs.length;i++){const leg=api.hexLegs[i];const collar=cyl(g.hex,.049,.035,[0,0,0],m.rim,.049,null,false,32),boot=cyl(g.hex,.046,.07,[0,0,0],m.seal,.046,null,false,20);leg.collar=collar;leg.boot=boot;bevel(g.hex,[.10,.08,.05],leg.from.toArray(),m.steel);}
 ring(g.hex,.12,.39,.018,[0,0,5.525],m.rim,'z');
 // Cabin hatches, gasket channels, latches and cable glands.
 bevel(g.cabin,[1.04,.78,.055],[0,0,-1.465],m.seal);bevel(g.cabin,[.96,.70,.06],[0,0,-1.505],m.white);
 for(const x of [-.43,.43])for(const y of [-.28,.28])cyl(g.cabin,.025,.035,[x,y,-1.55],m.steel,.025,[Math.PI/2,0,0],false,6);
 bevel(g.cabin,[.23,.04,.07],[.24,0,-1.565],m.rim);plate(g.cabin,'CASSEGRAIN',[.40,.10],[0,.18,-1.543],[0,Math.PI,0]);
 for(let i=0;i<6;i++){const x=(i-2.5)*.15;cyl(g.cabin,.052,.11,[x,-.92,-1.465],m.steel,.052,[Math.PI/2,0,0],false,12);pipe(g.cabin,[[x,-.92,-1.53],[x,-1.15,-1.65],[x,-1.4,-1.38]],.018,m.seal);}
 // Shutter retaining ring, hinge axle and two guide cheeks.
 ring(g.entrance,.54,.585,.025,[0,0,1.375],m.seal,'z');
 rod(g.entrance,[.62,-.22,1.4],[.62,.22,1.4],.032,m.steel);
 for(const y of [-.17,.17])bevel(g.entrance,[.13,.08,.16],[.62,y,1.4],m.rim);
 // Encoder graduation marks and eight reading-head brackets.
 const ticks=[];for(let i=0;i<256;i++){const a=TAU*i/256;ticks.push({position:[1.51*Math.cos(a),2.383,1.51*Math.sin(a)],rotation:[0,-a,0],scale:[1,i%16===0?2:1,1]});}instances(g.encoder,new T.BoxGeometry(.008,.016,.004),m.rim,ticks);
 for(let i=0;i<8;i++){const a=TAU*i/8,x=Math.cos(a),z=Math.sin(a);bevel(g.encoder,[.20,.045,.14],[x*1.53,2.30,z*1.53],m.steel,[0,-a,0]);pipe(g.encoder,[[x*1.54,2.42,z*1.54],[x*1.65,2.46,z*1.65],[x*1.69,2.3,z*1.69]],.009,m.seal);}
 // HVAC duct clamps and equipment corner guards.
 for(const y of [1.82,2.07]){torus(g.hvac,.092,.012,[2.5,y,-.4],m.steel,[Math.PI/2,0,0]);bevel(g.hvac,[.12,.035,.065],[2.5,y,-.51],m.rim);}
 for(const y of [.85,1.4]){ring(g.hvac,.185,.225,.025,[3.197,y,-.8],m.rim,'x');for(let j=0;j<3;j++)torus(g.hvac,.065+j*.05,.004,[3.215,y,-.8],m.steel,[0,Math.PI/2,0]);}
 const bladeShape=new T.Shape();bladeShape.moveTo(.035,-.012);bladeShape.bezierCurveTo(.09,-.075,.19,-.065,.185,.015);bladeShape.quadraticCurveTo(.12,.015,.04,.035);bladeShape.closePath();const bladeGeo=new T.ExtrudeGeometry(bladeShape,{depth:.012,bevelEnabled:true,bevelSize:.003,bevelThickness:.002,bevelSegments:1,curveSegments:12});bladeGeo.rotateY(Math.PI/2);
 for(const y of [.85,1.4])for(let i=0;i<5;i++)mesh(bladeGeo,m.dark,g.hvac,[3.19,y,-.8],[TAU*i/5,0,0]);
 for(const y of [.62,1.62])for(const z of [-1.4,-.2])bevel(g.hvac,[.08,.12,.12],[3.18,y,z],m.rim);
 // Open chain side plates, crossbars and pivot pins, instanced along the path.
 const linkShape=new T.Shape();linkShape.moveTo(-.073,-.06);linkShape.lineTo(.073,-.06);linkShape.lineTo(.073,.06);linkShape.lineTo(-.073,.06);linkShape.closePath();const linkHole=new T.Path();linkHole.moveTo(-.043,-.031);linkHole.lineTo(-.043,.031);linkHole.lineTo(.043,.031);linkHole.lineTo(.043,-.031);linkHole.closePath();linkShape.holes.push(linkHole);
 const linkGeo=new T.ExtrudeGeometry(linkShape,{depth:.018,bevelEnabled:true,bevelSize:.004,bevelThickness:.003,bevelSegments:1,steps:1});linkGeo.rotateY(Math.PI/2);
 const links=[],bars=[],pivots=[];api.cablePath.forEach(([x,y,z],i)=>{const a=-.7+i/40*Math.PI*1.7;for(const side of [-1,1]){links.push({position:[x+side*.062*Math.cos(a),y,z+side*.062*Math.sin(a)],rotation:[0,-a,0]});pivots.push({position:[x+side*.078*Math.cos(a),y,z+side*.078*Math.sin(a)],rotation:[0,-a,Math.PI/2]});}for(const side of [-1,1])bars.push({position:[x,y+side*.052,z],rotation:[0,-a,0]});});
 instances(g.wrap,linkGeo,m.dark,links);instances(g.wrap,new T.BoxGeometry(.15,.018,.035),m.steel,bars);instances(g.wrap,new T.CylinderGeometry(.019,.019,.018,12),m.rim,pivots);
 // Cable strain relief and connector blocks at the service transition.
 bevel(g.wrap,[.47,.16,.29],[.55,1.38,.34],m.steel);
 for(let i=0;i<4;i++){const x=.37+i*.115;cyl(g.wrap,.035,.12,[x,1.49,.34],m.rim,.035,null,false,12);cyl(g.wrap,.043,.045,[x,1.56,.34],m.seal,.043,null,false,16);}
 // Stow pin guide bushings, shoulders and coupling envelopes.
 for(const s of [-1,1]){
  ring(g.pins,.077,.12,.06,[s*2.13,2.48,.65],m.rim);ring(g.pins,.077,.14,.04,[s*2.13,2.6,.65],m.steel);cyl(g.pins,.095,.045,[s*2.13,2.83,.65],m.rim);
  bevel(g.pins,[.26,.24,.26],[s*2.13,1.96,.65],m.dark);cyl(g.pins,.11,.16,[s*2.13,1.79,.65],m.steel);bolts(g.pins,.085,6,[s*2.13,1.88,.65],'y',.5);
 }
}
