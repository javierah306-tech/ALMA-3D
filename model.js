import * as T from 'three';
import { PARAMETERS as P, PARTS } from './data.js';
import { machinedRingGeometry, precisionBoxGeometry, addPrecisionDetails } from './precision.js';

const TAU=Math.PI*2;
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export function buildAntenna(){
 const root=new T.Group(); root.name='AEM_12m_reconstruction_METRES';
 const byPart=Object.fromEntries(PARTS.map(p=>[p.id,[]]));
 const meshes=[],shells=[],exploders=[],hexLegs=[];
 const mat=(color,metalness=.2,roughness=.48)=>new T.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:metalness>.65?.12:.2,clearcoatRoughness:.4});
 const white=mat('#dce3e5',.12,.42), panel=mat('#d5dfe5',.64,.36),rim=mat('#c2cdd0',.86,.28),steel=mat('#879ca5',.92,.24),dark=mat('#263a44',.38,.48),black=mat('#152a31',.28,.52),copper=mat('#be915c',.88,.28),teal=mat('#58b8a8',.6,.35),seal=mat('#172a33',.02,.82),gold=mat('#d1b48a',.86,.27),safety=mat('#dca867',.4,.4);
 const finishCanvas=document.createElement('canvas');finishCanvas.width=finishCanvas.height=128;const finishContext=finishCanvas.getContext('2d'),finishData=finishContext.createImageData(128,128);let noiseSeed=27;for(let i=0;i<finishData.data.length;i+=4){noiseSeed=(noiseSeed*1664525+1013904223)>>>0;const value=165+(noiseSeed%35);finishData.data.set([value,value,value,255],i);}finishContext.putImageData(finishData,0,0);const finishMap=new T.CanvasTexture(finishCanvas);finishMap.wrapS=finishMap.wrapT=T.RepeatWrapping;finishMap.repeat.set(4,4);panel.roughnessMap=finishMap;panel.bumpMap=finishMap;panel.bumpScale=.00006;white.bumpMap=finishMap;white.bumpScale=.0001;
 const carbon=mat('#29404a',.35,.48);
 const cv=document.createElement('canvas');cv.width=cv.height=64;const cx=cv.getContext('2d');cx.fillStyle='#34464c';cx.fillRect(0,0,64,64);for(let i=-64;i<128;i+=8){cx.strokeStyle=i%16===0?'#59656a':'#223941';cx.lineWidth=4;cx.beginPath();cx.moveTo(i,0);cx.lineTo(i+64,64);cx.stroke();cx.strokeStyle='#3e5158';cx.lineWidth=2;cx.beginPath();cx.moveTo(i,64);cx.lineTo(i+64,0);cx.stroke();}const tex=new T.CanvasTexture(cv);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(5,5);tex.colorSpace=T.SRGBColorSpace;carbon.map=tex;
 const boltGeo=new T.LatheGeometry([[0,-.0175],[.030,-.0175],[.035,-.012],[.035,.011],[.027,.0175],[0,.0175]].map(p=>new T.Vector2(...p)),6);const washerGeo=machinedRingGeometry(.018,.05,.012,.002,32);
 function part(id,parent=root,offset=[0,0,0]){const g=new T.Group();g.name=id+'_'+PARTS.find(p=>p.id===id).en.replace(/[^a-zA-Z0-9]+/g,'_')+'_'+byPart[id].length;g.userData.part=id;parent.add(g);byPart[id].push(g);exploders.push({group:g,offset:V(...offset),home:g.position.clone()});return g;}
 function mesh(geo,m,parent,pos=[0,0,0],rot=null,shell=false){const o=new T.Mesh(geo,m.clone());o.position.set(...pos);if(rot)o.rotation.set(...rot);o.castShadow=true;o.receiveShadow=true;parent.add(o);meshes.push(o);if(shell){shells.push(o);o.userData.shell=true;}return o;}
 const box=(parent,size,pos,m=white,rot=null,shell=false)=>mesh(new T.BoxGeometry(...size),m,parent,pos,rot,shell);
 const cyl=(parent,r,h,pos,m=white,r2=r,rot=null,shell=false,n=64)=>mesh(new T.CylinderGeometry(r,r2,h,n,1,false),m,parent,pos,rot,shell);
 function torus(parent,r,t,pos,m=steel,rot=null,arc=TAU){return mesh(new T.TorusGeometry(r,t,8,Math.max(20,Math.round(110*arc/TAU)),arc),m,parent,pos,rot);}
 function beam(parent,a,b,width=.1,m=white,depth=width){const av=V(...a),bv=V(...b);const ob=box(parent,[width,av.distanceTo(bv),depth],av.clone().add(bv).multiplyScalar(.5).toArray(),m);ob.quaternion.setFromUnitVectors(V(0,1,0),bv.sub(av).normalize());return ob;}
 function rod(parent,a,b,r=.04,m=steel){const av=V(...a),bv=V(...b);const ob=cyl(parent,r,av.distanceTo(bv),av.clone().add(bv).multiplyScalar(.5).toArray(),m,r,null,false,16);ob.quaternion.setFromUnitVectors(V(0,1,0),bv.sub(av).normalize());return ob;}
 function pipe(parent,points,r=.03,m=steel){const curve=new T.CatmullRomCurve3(points.map(p=>V(...p)));return mesh(new T.TubeGeometry(curve,Math.max(12,points.length*5),r,6,false),m,parent);}
 function bolts(parent,r,n,pos=[0,0,0],axis='y',scale=1){const g=new T.Group();g.position.set(...pos);if(axis==='z')g.rotation.x=Math.PI/2;if(axis==='x')g.rotation.z=Math.PI/2;parent.add(g);const b=new T.InstancedMesh(boltGeo,steel.clone(),n),w=new T.InstancedMesh(washerGeo,rim.clone(),n),d=new T.Object3D();for(let i=0;i<n;i++){const a=TAU*i/n;d.position.set(Math.cos(a)*r,.015*scale,Math.sin(a)*r);d.scale.setScalar(scale);d.updateMatrix();b.setMatrixAt(i,d.matrix);d.position.y=0;d.updateMatrix();w.setMatrixAt(i,d.matrix);}b.castShadow=w.castShadow=true;g.add(b,w);meshes.push(b,w);return g;}
 function curveRing(parent,r,z,m=steel,t=.035){return torus(parent,r,t,[0,0,z],m);}
 const zsurf=r=>P.vertexOffset+r*r/(4*P.focalLength);
 function annularSurface(parent,r0,r1,zOffset,thickness,m,shell=false,theta0=0,theta1=TAU){
  const nr=Math.max(3,Math.ceil((r1-r0)*10)),nt=Math.max(4,Math.ceil((theta1-theta0)*48)),positions=[],normals=[],indices=[];
  for(let side=0;side<2;side++)for(let j=0;j<=nr;j++)for(let i=0;i<=nt;i++){const r=r0+(r1-r0)*j/nr,a=theta0+(theta1-theta0)*i/nt;positions.push(r*Math.cos(a),r*Math.sin(a),zsurf(r)+zOffset-side*thickness);const normal=V(-r*Math.cos(a)/(2*P.focalLength),-r*Math.sin(a)/(2*P.focalLength),1).normalize().multiplyScalar(side?-1:1);normals.push(normal.x,normal.y,normal.z);}
  const k=(nr+1)*(nt+1);for(let j=0;j<nr;j++)for(let i=0;i<nt;i++){const a=j*(nt+1)+i,b=a+1,c=a+nt+1,d=c+1;indices.push(a,c,b,b,c,d,a+k,b+k,c+k,b+k,d+k,c+k);}
  const wall=(triangles)=>{for(let t=0;t<triangles.length;t+=3){const ids=triangles.slice(t,t+3),points=ids.map(i=>V(...positions.slice(i*3,i*3+3))),n=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).normalize();for(const p of points){indices.push(positions.length/3);positions.push(p.x,p.y,p.z);normals.push(n.x,n.y,n.z);}}};
  for(let j=0;j<nr;j++)for(const i of [0,nt]){const a=j*(nt+1)+i,b=a+nt+1;wall(i===0?[a,a+k,b,b,a+k,b+k]:[a,b,a+k,b,b+k,a+k]);}
  for(let i=0;i<nt;i++)for(const j of [0,nr]){const a=j*(nt+1)+i,b=a+1;wall(j===0?[a,b,a+k,b,b+k,a+k]:[a,a+k,b,b,a+k,b+k]);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new T.Float32BufferAttribute(positions.flatMap((_,i)=>i%3===0?[positions[i]/12+.5,positions[i+1]/12+.5]:[]),2));geo.setIndex(indices);const ob=mesh(geo,m,parent,[0,0,0],null,shell);ob.material.side=T.DoubleSide;return ob;
 }
 // Fixed steel pedestal and three-point foundation interface.
 const pedestal=part('A01');
 cyl(pedestal,1.22,1.4,[0,.95,0],white,1.95,null,true,12);
 cyl(pedestal,1.98,.13,[0,.2,0],rim,1.98);
 cyl(pedestal,1.3,.14,[0,1.7,0],white);
 bolts(pedestal,1.19,40,[0,1.79,0]);
 for(let i=0;i<3;i++){const a=i*TAU/3+Math.PI/6,x=Math.cos(a),z=Math.sin(a);const foot=new T.Group();foot.position.set(x*1.78,.17,z*1.78);foot.rotation.y=-a;pedestal.add(foot);box(foot,[.88,.22,.75],[0,0,0],white);for(let s of [-1,1]){box(foot,[.18,.1,.55],[s*.25,-.15,0],steel);cyl(foot,.058,.28,[s*.25,-.11,.16],steel,.058,null,false,8);}beam(pedestal,[x*1.25,1.45,z*1.25],[x*1.8,.4,z*1.8],.11,white,.32);}
 for(let i=0;i<12;i++){const a=TAU*i/12;beam(pedestal,[Math.cos(a)*1.33,1.58,Math.sin(a)*1.33],[Math.cos(a)*1.88,.32,Math.sin(a)*1.88],.018,rim,.025);}
 box(pedestal,[.57,.6,.04],[0,.95,1.65],rim,null,true);box(pedestal,[.08,.03,.07],[.2,.98,1.69],dark);
 // AZ rotation is physically separated from the fixed pedestal.
 const azimuth=new T.Group();azimuth.name='AZIMUTH_AXIS';azimuth.position.y=1.8;root.add(azimuth);
 const bearing=part('A03',root,[0,.55,0]);
 for(const y of [1.87,2.03,2.28]){torus(bearing,1.15,.045,[0,y,0],steel,[Math.PI/2,0,0]);torus(bearing,1.39,.042,[0,y,0],rim,[Math.PI/2,0,0]);}
 for(const y of [1.84,2.31]){mesh(machinedRingGeometry(1.08,1.48,.08),steel,bearing,[0,y,0]);bolts(bearing,1.42,40,[0,y+.05,0], 'y',.8);}
 // Three rows of separate rollers, instanced for browser performance.
 for(let row=0;row<3;row++){const n=48,im=new T.InstancedMesh(new T.CylinderGeometry(.042,.042,row===1?.14:.17,10),rim.clone(),n),d=new T.Object3D();for(let i=0;i<n;i++){const a=TAU*(i+.5)/n;d.position.set(1.27*Math.cos(a),1.95+row*.105,1.27*Math.sin(a));if(row!==1)d.quaternion.setFromUnitVectors(V(0,1,0),V(Math.cos(a),0,Math.sin(a)));else d.quaternion.identity();d.updateMatrix();im.setMatrixAt(i,d.matrix);}bearing.add(im);meshes.push(im);im.castShadow=true;}
 const driveAZ=part('A04',root,[0,1.1,0]);
 const rotorAZ=part('A04',azimuth,[0,1.1,0]);
 torus(driveAZ,1.56,.045,[0,2.04,0],copper,[Math.PI/2,0,0]);
 for(let i=0;i<12;i++){const a=i*TAU/12;const g=new T.Group();g.position.set(Math.cos(a)*1.66,2.07,Math.sin(a)*1.66);g.rotation.y=-a;driveAZ.add(g);box(g,[.18,.27,.46],[0,0,0],dark);for(let k=0;k<5;k++)box(g,[.19,.18,.045],[0,0,(k-2)*.075],copper);box(g,[.1,.32,.51],[.14,0,0],steel);}
 const encoder=part('A13',root,[0,.8,0]);
 torus(encoder,1.51,.018,[0,2.36,0],teal,[Math.PI/2,0,0]);
 for(let i=0;i<8;i++){const a=TAU*i/8;box(encoder,[.12,.11,.08],[1.52*Math.cos(a),2.38,1.52*Math.sin(a)],teal,[0,-a,0]);}
 // Yoke assembly and platform. Arm outline follows the exterior drawing.
 const yoke=part('A02',azimuth,[0,.45,0]);
 box(yoke,[4.12,.32,2.75],[0,.9,0],white,null,true);
 box(yoke,[2.9,.18,2.5],[0,.52,0],dark);
 cyl(yoke,1.12,.18,[0,.68,0],white);
 const armShape=new T.Shape();armShape.moveTo(-1.12,.92);armShape.lineTo(1.1,.92);armShape.lineTo(.57,2.18);armShape.lineTo(.4,3.55);armShape.quadraticCurveTo(0,4.13,-.43,3.55);armShape.lineTo(-.66,2.14);armShape.closePath();
 const armGeo=new T.ExtrudeGeometry(armShape,{depth:.48,bevelEnabled:true,bevelSize:.045,bevelThickness:.04,bevelSegments:2,steps:1});
 for(const s of [-1,1]){
  const ag=new T.Group();ag.position.x=s*1.94;ag.rotation.y=Math.PI/2;yoke.add(ag);mesh(armGeo,white,ag,[0,0,-.24],null,true);
  box(ag,[1.8,.12,.56],[0,1.06,0],rim);box(ag,[.15,1.15,.57],[.1,1.67,0],rim);
  for(const zz of [-.32,.32])beam(ag,[-.8,1.16,zz],[-.34,3.35,zz],.05,white,.045);
  cyl(yoke,.52,.56,[s*1.93,3.5,0],steel,.52,[0,0,Math.PI/2]);
  torus(yoke,.43,.05,[s*2.25,3.5,0],rim,[0,Math.PI/2,0]);bolts(yoke,.43,20,[s*2.29,3.5,0],'x',1.1);
  const de=part('A04',azimuth,[s*1.2,.45,0]);
  torus(de,.53,.065,[s*2.32,3.5,0],dark,[0,Math.PI/2,0]);
  for(let i=0;i<16;i++){const a=TAU*i/16;box(de,[.13,.085,.16],[s*2.34,3.5+.51*Math.cos(a),.51*Math.sin(a)],copper,[a,0,0]);}
  cyl(de,.32,.07,[s*2.41,3.5,0],white,.32,[0,0,Math.PI/2]);bolts(de,.24,8,[s*2.46,3.5,0],'x',.8);
 }
 // Service platform, grating, railings, equipment racks.
 box(yoke,[4.65,.12,1.22],[0,1.33,-1.7],steel);
 for(let i=0;i<30;i++)box(yoke,[.025,.028,1.2],[-2.25+i*.155,1.41,-1.7],rim);
 for(const z of [-2.3,-1.1]){for(const x of [-2.25,-1.1,0,1.1,2.25])beam(yoke,[x,1.4,z],[x,2.2,z],.032,rim);beam(yoke,[-2.25,2.2,z],[2.25,2.2,z],.035,rim);beam(yoke,[-2.25,1.82,z],[2.25,1.82,z],.025,rim);}
 for(const x of [-2.25,2.25])beam(yoke,[x,2.2,-2.3],[x,2.2,-1.1],.035,rim);
 for(let x=-1.65;x<2;x+=1.1){box(yoke,[1,.85,.55],[x,.83,-1.73],white,null,true);box(yoke,[.88,.75,.03],[x,.85,-2.025],rim);box(yoke,[.025,.12,.025],[x+.32,.87,-2.05],dark);}
 // Tilting assembly; all optical components share this coordinate system.
 const elevation=new T.Group();elevation.name='ELEVATION_AXIS';elevation.position.y=3.5;azimuth.add(elevation);
 const cabin=part('A11',elevation,[0,0,-1.5]);
 cyl(cabin,P.cabinRadius,P.cabinLength,[0,0,-.05],white,P.cabinRadius,[Math.PI/2,0,0],true,96);
 for(const z of [-1.36,-1.1,.95,1.26]){curveRing(cabin,1.64,z,rim,.045);bolts(cabin,1.58,48,[0,0,z],'z',.8);}
 cyl(cabin,1.53,.08,[0,0,-1.4],white,1.53,[Math.PI/2,0,0],true);
 for(let a=0;a<TAU;a+=TAU/16)beam(cabin,[1.635*Math.cos(a),1.635*Math.sin(a),-1.2],[1.635*Math.cos(a),1.635*Math.sin(a),1.12],.025,rim);
 box(cabin,[.9,.035,1.15],[0,-1.61,-.2],rim);box(cabin,[.76,.04,.98],[0,-1.64,-.2],white,null,true);
 // Instrument envelope is contextual, not an OEM reconstruction.
 const cryo=cyl(cabin,.67,1.24,[0,0,-.25],steel,.67,[Math.PI/2,0,0]);cryo.name='C04_cryostat_contextual_envelope';
 for(const z of [-.88,.37]){curveRing(cabin,.69,z,gold,.04);bolts(cabin,.61,20,[0,0,z],'z',.8);}
 for(let i=0;i<8;i++){const a=TAU*i/8;rod(cabin,[Math.cos(a)*.62,Math.sin(a)*.62,.41],[Math.cos(a)*.92,Math.sin(a)*.92,.78],.04,copper);}
 for(const x of [-1.2,1.2]){box(cabin,[.28,.8,1.3],[x,-.6,-.15],dark);for(let j=0;j<5;j++)box(cabin,[.31,.025,1.2],[x,-.9+j*.15,-.15],rim);}
 box(cabin,[2.2,.2,.68],[0,-1.15,-1.62],dark);for(let i=0;i<7;i++)box(cabin,[.05,.25,.72],[-.9+i*.3,-1.18,-1.62],steel);
 // Primary: 120 individual, closed sandwich panels in five rings.
 const reflector=part('A06',elevation,[0,0,1.25]);
 const panelObjects=[];
 for(let ring=0;ring<5;ring++){
  const n=P.panelRings[ring],r0=P.ringRadii[ring]+.003,r1=P.ringRadii[ring+1]-(ring===4?0:.003);
  for(let j=0;j<n;j++){const a=TAU*j/n+.002/r1,b=TAU*(j+1)/n-.002/r1;const ob=annularSurface(reflector,r0,r1,0,.055,panel,true,a,b);ob.name=`A06_panel_R${ring+1}_${String(j+1).padStart(2,'0')}`;ob.material.color.offsetHSL(0,0,((j+ring)%5-2)*.006);panelObjects.push(ob);}
 }
 curveRing(reflector,6,zsurf(6)-.045,rim,.036);curveRing(reflector,.7,zsurf(.7),rim,.022);
 const bus=part('A05',elevation,[0,0,.35]);
 for(let sector=0;sector<24;sector++)annularSurface(bus,1.6,6,-.2,.66,white,true,sector*TAU/24+.00025,(sector+1)*TAU/24-.00025);
 for(let ring=0;ring<5;ring++){
  const r=P.ringRadii[ring+1]-.08;curveRing(bus,r,zsurf(r)-.3,carbon,.065);curveRing(bus,r,zsurf(r)-.72,carbon,.06);
 }
 for(let i=0;i<24;i++){
  const a=TAU*i/24,point=(r,off)=>[r*Math.cos(a),r*Math.sin(a),zsurf(r)+off];
  const ribRadii=[1.64,1.76,2.82,3.88,4.94,5.98];
  for(let ri=0;ri<ribRadii.length-1;ri++)beam(bus,point(ribRadii[ri],-.3),point(ribRadii[ri+1],-.3),.11,carbon,.15);
  beam(bus,point(1.64,-.65),point(5.98,-.72),.1,carbon,.13);
  for(let j=1;j<5;j++){const r=P.ringRadii[j],r2=P.ringRadii[j+1];beam(bus,point(r,-.3),point(r2,-.72),.052,carbon);}
 }
 for(let i=0;i<12;i++){const a=TAU*i/12;const r=3.2;box(bus,[.15,.25,.08],[r*Math.cos(a),r*Math.sin(a),zsurf(r)-.76],rim,[0,0,a]);}
 const adjusters=part('A07',elevation,[0,0,.85]);
 const adjusterPositions=[];
 for(let ring=0;ring<5;ring++){const n=P.panelRings[ring];for(let j=0;j<n;j++){
  const a=TAU*(j+.5)/n,r=(P.ringRadii[ring]+P.ringRadii[ring+1])*.5,x=r*Math.cos(a),y=r*Math.sin(a),z=zsurf(r);
  adjusterPositions.push([x,y,z]);
 }}
 for(const [r,h,dz,m] of [[.035,.22,-.13,steel],[.08,.055,-.235,rim]]){
  const im=new T.InstancedMesh(new T.CylinderGeometry(r,r,h,8),m.clone(),120),d=new T.Object3D();d.rotation.x=Math.PI/2;
  adjusterPositions.forEach(([x,y,z],i)=>{d.position.set(x,y,z+dz);d.updateMatrix();im.setMatrixAt(i,d.matrix);});im.castShadow=im.receiveShadow=true;adjusters.add(im);meshes.push(im);
 }
 // Four single-beam CFRP quadripod legs, diagonal in frontal projection.
 const quadripod=part('A08',elevation,[0,0,2]);
 for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,r=5.75,x=Math.cos(a),y=Math.sin(a);const a0=[r*x,r*y,zsurf(r)+.04],b0=[.34*x,.34*y,5.42];beam(quadripod,a0,b0,.135,white,.18);box(quadripod,[.28,.34,.18],a0,rim,[0,0,a]);cyl(quadripod,.078,.27,[...a0.slice(0,2),a0[2]+.04],steel,.078,[0,Math.PI/2,a]);rod(quadripod,[a0[0],a0[1],a0[2]+.09],[b0[0],b0[1],b0[2]+.09],.012,rim);}
 const hex=part('A10',elevation,[0,0,2.4]);
 const hexBase=machinedRingGeometry(.12,.43,.065,.006);hexBase.rotateX(Math.PI/2);mesh(hexBase,rim,hex,[0,0,5.48]);bolts(hex,.34,12,[0,0,5.52],'z',.7);
 const platform=new T.Group();platform.name='HEXAPOD_MOVING_PLATFORM';hex.add(platform);
 cyl(platform,.31,.05,[0,0,5.06],steel,.31,[Math.PI/2,0,0]);bolts(platform,.26,12,[0,0,5.02],'z',.6);
 for(let i=0;i<6;i++){
  const pair=Math.floor(i/2),a=pair*TAU/3+(i%2===0?-.16:.16),b=pair*TAU/3+Math.PI/3+(i%2===0?.17:-.17),from=V(Math.cos(a)*.34,Math.sin(a)*.34,5.43),to=V(Math.cos(b)*.24,Math.sin(b)*.24,5.1);
  const sleeve=cyl(hex,.038,.24,[0,0,0],white,.038,null,false,12),shaft=cyl(hex,.017,.3,[0,0,0],steel,.017,null,false,12);
 const jointGeo=new T.SphereGeometry(.045,24,16);mesh(jointGeo,steel,hex,from.toArray());const joint=mesh(jointGeo,steel,hex,to.toArray());hexLegs.push({from,to,sleeve,shaft,joint});
 }
 const secondary=part('A09',platform,[0,0,0]);
 const secondaryPoints=[];for(let i=0;i<=20;i++){const r=.375*i/20;secondaryPoints.push(new T.Vector2(r,.12*(r/.375)**2));}
 const secondaryGeo=new T.LatheGeometry(secondaryPoints,128);secondaryGeo.rotateX(Math.PI/2); // local lathe Y becomes local optical Z
 const sec=mesh(secondaryGeo,panel,secondary,[0,0,4.85]);sec.material.side=T.DoubleSide;
 curveRing(secondary,.375,4.97,steel,.014);cyl(secondary,.26,.1,[0,0,5],dark,.32,[Math.PI/2,0,0]);
 // Membrane and shutter at the central entrance. The hinge is illustrative.
 const entrance=part('A12',elevation,[0,0,.5]);
 curveRing(entrance,.61,1.34,rim,.05);bolts(entrance,.6,24,[0,0,1.36],'z',.65);
 const membraneMat=new T.MeshPhysicalMaterial({color:'#90c9d5',metalness:.1,roughness:.45,transparent:true,opacity:.32,side:T.DoubleSide,depthWrite:false});
 mesh(new T.CircleGeometry(.56,64),membraneMat,entrance,[0,0,1.35]);
 const shutterHinge=new T.Group();shutterHinge.position.set(.62,0,1.4);entrance.add(shutterHinge);cyl(shutterHinge,.57,.045,[-.62,0,0],white,.57,[Math.PI/2,0,0],true);box(entrance,[.12,.3,.11],[.62,0,1.4],steel);shutterHinge.rotation.y=-Math.PI*.85;
 // Mechanical metrology interfaces, thermal sensor positions are illustrative.
 const metrology=part('A13',azimuth,[0,.8,0]);
 for(const s of [-1,1]){torus(metrology,.58,.014,[s*2.31,3.5,0],teal,[0,Math.PI/2,0]);box(metrology,[.12,.1,.14],[s*2.32,4.1,0],teal);}
 box(metrology,[.32,.18,.24],[0,1.13,.7],teal);
 const thermalSensors=part('A13',elevation,[0,0,.7]);
 for(let i=0;i<8;i++){const a=i*TAU/8;box(thermalSensors,[.09,.14,.06],[3.35*Math.cos(a),3.35*Math.sin(a),zsurf(3.35)-.85],teal,[0,0,a]);}
 const hvac=part('A14',azimuth,[3.1,0,-.2]);
 box(hvac,[1.2,1.1,1.25],[2.55,1.12,-.8],white,null,true);box(hvac,[1.22,1.14,.08],[2.55,1.12,-1.47],steel);
 for(let j=0;j<15;j++)box(hvac,[1.08,.024,.065],[2.55,.65+j*.069,-1.53],rim);
 for(const y of [.85,1.4]){torus(hvac,.21,.018,[3.18,y,-.8],steel,[0,Math.PI/2,0]);cyl(hvac,.045,.04,[3.20,y,-.8],steel,.045,[0,0,Math.PI/2]);}
 pipe(hvac,[[2.5,1.6,-.4],[2.5,2.3,-.4],[1.65,2.6,-.4],[1.55,3.2,-.4]],.09,rim);
 const wrap=part('A15',root,[-2.7,0,0]);
 const path=[];for(let i=0;i<=40;i++){const a=-.7+i/40*Math.PI*1.7,r=.7+.35*i/40;path.push([Math.cos(a)*r,.62+i/40*.5,Math.sin(a)*r]);}
 pipe(wrap,path,.04,black);
 for(let k=0;k<3;k++)pipe(wrap,path.map(([x,y,z])=>[x,y+.03+k*.035,z+.07]),.012,k===0?copper:teal);
 pipe(wrap,[[.7,1.06,.3],[.7,1.45,.3],[.5,1.8,.3],[.5,2.3,.3]],.08,seal);
 const pins=part('A16',azimuth,[-2.8,0,0]);
 for(const s of [-1,1]){box(pins,[.34,.35,.38],[s*2.14,2.3,.65],white);cyl(pins,.075,.7,[s*2.13,2.52,.65],safety,.075,null,false,16);cyl(pins,.14,.19,[s*2.13,2.12,.65],steel,.14);box(pins,[.12,.15,.13],[s*2.35,2.3,.66],teal);}
 box(pins,[.43,.28,.38],[0,.33,1.4],white);cyl(pins,.065,.55,[0,.12,1.4],safety,.065,null,false,16);
 // Additional axis brake envelopes are contextual, their OEM layout is not established.
 const brake=box(yoke,[.24,.33,.21],[2.37,3.1,.38],steel);brake.name='C01_axis_brake_illustrative';
 // Small service ladder and lifting lugs on the yoke.
 for(const x of [-.38,.38])beam(yoke,[x,.15,-2.38],[x,1.4,-2.38],.035,steel);for(let j=0;j<5;j++)beam(yoke,[-.38,.25+j*.23,-2.38],[.38,.25+j*.23,-2.38],.04,rim);
 addPrecisionDetails({part,mesh,box,cyl,torus,rod,pipe,bolts,meshes,zsurf,adjusterPositions,hexLegs,cablePath:path,materials:{white,panel,rim,steel,dark,black,copper,teal,seal,gold,safety,carbon}}, {pedestal,bearing,rotorAZ,elevation,yoke,bus,adjusters,quadripod,secondary,hex,cabin,entrance,encoder,hvac,wrap,pins});
 // Batch repeated structural plates and beams without losing component identity.
 for(const group of [bus,yoke,hvac,cabin,driveAZ]){
  const batches=new Map();
  for(const ob of [...group.children])if(ob.isMesh&&ob.geometry.type==='BoxGeometry'&&!ob.userData.shell){const key=ob.material.color.getHex();if(!batches.has(key))batches.set(key,[]);batches.get(key).push(ob);}
  for(const objects of batches.values())if(objects.length>3){const im=new T.InstancedMesh(new T.BoxGeometry(1,1,1),objects[0].material.clone(),objects.length),d=new T.Object3D();
   objects.forEach((ob,i)=>{const p=ob.geometry.parameters;d.position.copy(ob.position);d.quaternion.copy(ob.quaternion);d.scale.set(p.width*ob.scale.x,p.height*ob.scale.y,p.depth*ob.scale.z);d.updateMatrix();im.setMatrixAt(i,d.matrix);group.remove(ob);const index=meshes.indexOf(ob);if(index>=0)meshes.splice(index,1);});im.castShadow=im.receiveShadow=true;group.add(im);meshes.push(im);
  }
 }
 // Resolve inherited part IDs once, including instanced meshes.
 root.traverse(o=>{if(o.isMesh){let p=o;while(p&&!p.userData.part)p=p.parent;if(p)o.userData.part=p.userData.part;o.userData.originalColor=o.material.color?.getHex();o.userData.originalOpacity=o.material.opacity;o.userData.originalTransparent=o.material.transparent;o.userData.originalDepthWrite=o.material.depthWrite;o.material.clippingPlanes=[];}});
 // Save local transforms after construction (not before positioning).
 for(const e of exploders)e.home.copy(e.group.position);
 function updateHex(mm=0){const dz=mm*.001*10;platform.position.z=dz;for(const l of hexLegs){const end=l.to.clone();end.z+=dz;const dir=end.clone().sub(l.from),len=dir.length();l.sleeve.position.copy(l.from).addScaledVector(dir,.3);l.sleeve.quaternion.setFromUnitVectors(V(0,1,0),dir.clone().normalize());l.sleeve.scale.y=Math.min(.24,len*.55)/.24;l.shaft.position.copy(l.from).addScaledVector(dir,.72);l.shaft.quaternion.copy(l.sleeve.quaternion);l.shaft.scale.y=len*.6/.3;l.joint.position.copy(end);if(l.collar){l.collar.position.copy(l.from).addScaledVector(dir,.55);l.collar.quaternion.copy(l.sleeve.quaternion);l.boot.position.copy(l.from).addScaledVector(dir,.14);l.boot.quaternion.copy(l.sleeve.quaternion);}}}
 updateHex();root.updateMatrixWorld(true);
 return {root,byPart,meshes,shells,exploders,azimuth,elevation,platform,secondary,shutterHinge,updateHex,hexLegs,panelObjects,adjusterPositions,parameters:P};
}
