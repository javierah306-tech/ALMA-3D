import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { buildAntenna } from './model.js';
import { PARTS, PARAMETERS, SOURCES } from './data.js';
import { EDUCATION } from './education.js';

const $=id=>document.getElementById(id), V=(...a)=>new THREE.Vector3(...a);
const state={mode:'exterior',selected:'A06',inspectorTab:'description',isolated:false,labels:true,dimensions:false,grid:true,animate:false,az:0,el:65,focus:0,shutterOpen:true,explosion:0};
const symbols={A01:'⌂',A02:'⊔',A03:'◎',A04:'◉',A05:'⌘',A06:'◎',A07:'↟',A08:'╳',A09:'◉',A10:'⬡',A11:'◯',A12:'◐',A13:'⌾',A14:'▤',A15:'∿',A16:'↥'};
let renderer,scene,camera,controls,antenna,clock,lastTime=0,drawCount=0,focusTween=null,toastTimer;
const labelNodes=new Map(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const selectedBox=new THREE.Box3(),clipPlane=new THREE.Plane(V(-1,0,0),0);
let dimensionGroup,dimensionLabel,grid,axisGroup;
function toast(s){$('toast').textContent=s;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3500);}

function renderList(filter=''){
 const needle=filter.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const found=PARTS.filter(p=>[p.name,p.short,p.en,p.id,p.material].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(needle));
 $('parts-list').replaceChildren();
 for(const cat of ['Montura','Reflector y óptica','Accionamiento','Servicios']){
  const ps=found.filter(p=>p.category===cat);if(!ps.length)continue;
  const title=document.createElement('div');title.className='part-group-title';title.textContent=cat;$('parts-list').append(title);
  for(const p of ps){const b=document.createElement('button');b.className='part-row'+(p.id===state.selected?' selected':'');b.dataset.part=p.id;b.setAttribute('aria-pressed',String(p.id===state.selected));b.innerHTML=`<span class="part-code">${p.id}</span><span class="row-label">${p.short}</span><span class="eye">◉</span>`;b.onclick=()=>selectPart(p.id,true);$('parts-list').append(b);}
 }
 if(!found.length){const p=document.createElement('p');p.className='no-results';p.textContent='Ningún componente coincide con la búsqueda.';$('parts-list').append(p);}
}
function updateInspector(){
 const p=PARTS.find(p=>p.id===state.selected),n=PARTS.indexOf(p)+1;
 $('part-index').textContent=p.id+' / 16';$('part-kind').textContent=p.category+' / '+p.tag;$('part-name').textContent=p.name;$('part-en').textContent=p.en;$('part-material').textContent=p.material;$('part-function').textContent=p.function;$('part-detail').textContent=p.detail;$('part-evidence').textContent=p.evidence;$('part-inspect').textContent=p.inspect;$('part-source').href=SOURCES.report+'#page='+p.page;$('part-source').innerHTML=`Informe técnico · p. ${p.page} <span>↗</span>`;$('nav-position').textContent=String(n).padStart(2,'0')+' de 16';$('part-symbol').textContent=symbols[p.id];$('shutter-button').hidden=p.id!=='A12';$('isolate-part').textContent=state.isolated?'◇ Ver conjunto':'◇ Aislar';$('isolate-part').classList.toggle('active',state.isolated);
 const e=EDUCATION[p.id];
 $('part-description').textContent=e.description;$('part-role').textContent=e.role;$('part-behavior').textContent=e.behavior;$('part-principle').textContent=e.principle;$('part-key').textContent=e.key;
 $('part-steps').replaceChildren();e.steps.forEach(([title,body],i)=>{const li=document.createElement('li'),number=document.createElement('span'),text=document.createElement('div'),h=document.createElement('h4'),para=document.createElement('p');number.className='step-number';number.textContent=String(i+1).padStart(2,'0');h.textContent=title;para.textContent=body;text.append(h,para);li.append(number,text);$('part-steps').append(li);});
 $('part-elements').replaceChildren();e.elements.forEach(name=>{const span=document.createElement('span');span.textContent=name;$('part-elements').append(span);});
 $('part-relations').replaceChildren();e.relation.forEach(id=>{const related=PARTS.find(p=>p.id===id),button=document.createElement('button');button.className='related-part';button.dataset.relatedPart=id;const code=document.createElement('span'),name=document.createElement('b'),arrow=document.createElement('i');code.textContent=id;name.textContent=related.short;arrow.textContent='↗';button.append(code,name,arrow);button.onclick=()=>{selectPart(id,true);$('inspector').scrollTo({top:0,behavior:'smooth'});};$('part-relations').append(button);});
 for(const b of document.querySelectorAll('.part-row')){const yes=b.dataset.part===state.selected;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes));}
}
function setInspectorTab(tab){state.inspectorTab=tab;for(const id of ['description','operation']){const yes=id===tab;$(id+'-tab').classList.toggle('active',yes);$(id+'-tab').setAttribute('aria-selected',String(yes));$(id+'-tab').tabIndex=yes?0:-1;$(id+'-pane').hidden=!yes;}}
function selectPart(id,fromList=false){const changed=state.selected!==id;state.selected=id;updateInspector();if(changed)$('inspector').scrollTo({top:0});if(antenna)applyMaterials();if(fromList||innerWidth<=960)$('inspector').classList.add('mobile-open');if(fromList){if(state.mode==='exterior'&&['A03','A04','A05','A07','A10','A13','A15'].includes(id)){setMode('xray');toast('Vista interior activada para observar el mecanismo.');}}}
function applyMaterials(){
 if(!antenna)return;
 for(const ob of antenna.meshes){const m=ob.material,yes=ob.userData.part===state.selected,shell=ob.userData.shell;
  ob.visible=!state.isolated||yes;
  m.color?.setHex(ob.userData.originalColor??0xffffff);if(yes&&!state.isolated)m.color?.lerp(new THREE.Color('#a2dace'),.095);
  if(m.emissive){m.emissive.set(yes?'#70b6a5':'#000000');m.emissiveIntensity=yes?.075:0;}
  const transparent=state.mode==='xray'&&shell&&!state.isolated;
  m.opacity=transparent?(yes?.3:.1):ob.userData.originalOpacity;
  m.transparent=transparent||ob.userData.originalTransparent;m.depthWrite=transparent?false:ob.userData.originalDepthWrite;
  m.clippingPlanes=state.mode==='section'?[clipPlane]:[];m.clipShadows=true;
  m.side=state.mode==='section'||transparent?THREE.DoubleSide:THREE.FrontSide;
  if(ob.geometry.type==='LatheGeometry'||ob.geometry.type==='CircleGeometry'||ob.userData.originalTransparent)m.side=THREE.DoubleSide;
  m.needsUpdate=true;
 }
 if(renderer)renderer.shadowMap.needsUpdate=true;
}
const modeText={exterior:['01 / CONJUNTO GENERAL','Precisión en cada movimiento.','Explora los sistemas que orientan un reflector de 12 metros.'],xray:['02 / MECÁNICA INTERIOR','La estructura que lo hace posible.','Envolventes transparentes. Sistemas mecánicos visibles.'],section:['03 / SECCIÓN DEL CONJUNTO','Una mirada al interior.','Corte visual por un plano vertical fijo de la escena.'],exploded:['04 / RELACIONES DE MONTAJE','Cada pieza tiene su lugar.','Conjuntos separados para estudiar cómo se relacionan.']};
function setMode(mode){state.mode=mode;for(const b of document.querySelectorAll('[data-mode]')){b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode));}const t=modeText[mode];$('view-kicker').textContent=t[0];$('view-title').textContent=t[1];$('view-description').textContent=t[2];$('mode-note').hidden=mode==='exterior';$('mode-note').textContent=mode==='xray'?'Geometría interna representativa · consultar trazabilidad':mode==='section'?'Sección visual sin tapas · detalles internos reconstruidos':'Separación ilustrativa · cotas válidas en posición ensamblada';applyMaterials();}
function getBounds(id){selectedBox.makeEmpty();for(const g of antenna.byPart[id]){g.updateWorldMatrix(true,true);selectedBox.union(new THREE.Box3().setFromObject(g));}return selectedBox.clone();}
function homeView(instant=false){const target=V(0,5.6,0),pos=V(17,11.5,21);if(window.innerWidth<640)pos.multiplyScalar(1.25);moveCamera(pos,target,instant);}
function moveCamera(pos,target,instant=false){if(instant){camera.position.copy(pos);controls.target.copy(target);controls.update();focusTween=null;}else focusTween={from:camera.position.clone(),targetFrom:controls.target.clone(),to:pos,targetTo:target,t:0};}
function focusPart(){
 if(state.selected==='A07'){const [x,y,z]=antenna.adjusterPositions[0],group=antenna.byPart.A07[0];group.updateWorldMatrix(true,false);const center=group.localToWorld(V(x,y,z-.13)),direction=V(1,.35,-1).transformDirection(group.matrixWorld);moveCamera(center.clone().addScaledVector(direction,1.05),center);toast('Detalle de un ajustador representativo · A07');return;}
 const b=getBounds(state.selected),center=b.getCenter(V()),size=b.getSize(V()).length();let direction=camera.position.clone().sub(controls.target).normalize();if(state.selected==='A09')direction=V(1,.4,1).normalize();if(state.selected==='A10')direction=V(1,.15,.25).transformDirection(antenna.elevation.matrixWorld);const dist=Math.max(.9,size*1.1);moveCamera(center.clone().addScaledVector(direction,dist),center);
}
function initDimensions(){
 dimensionGroup=new THREE.Group();dimensionGroup.name='documented_primary_diameter';
 const points=[V(-6,0,4.05),V(6,0,4.05),V(-6,0,3.83),V(-6,0,4.27),V(6,0,3.83),V(6,0,4.27)];
 const geom=new THREE.BufferGeometry().setFromPoints(points),line=new THREE.LineSegments(geom,new THREE.LineBasicMaterial({color:'#e4bc83',transparent:true,opacity:.9,depthTest:false}));line.renderOrder=100;dimensionGroup.add(line);antenna.elevation.add(dimensionGroup);dimensionGroup.visible=false;
 dimensionLabel=document.createElement('div');dimensionLabel.className='scene-label selected';dimensionLabel.textContent='Ø 12 000 mm · documentado';dimensionLabel.style.color='#e9c999';dimensionLabel.hidden=true;$('labels').append(dimensionLabel);
}
const labelAnchors={A01:[0,.9,1.9],A02:[2.25,4.9,.3],A03:[-1.3,2.12,0],A04:[1.7,2.05,0],A05:[-3.9,-2,z=>0],A06:[3.8,1.2,2.1],A07:[-3,1.3,1.6],A08:[-3.7,3.7,3.7],A09:[0,0,4.85],A10:[.3,0,5.35],A11:[1.7,0,-.3],A12:[.5,0,1.5],A13:[-1.5,2.4,.5],A14:[2.8,3,-1],A15:[-.8,.8,.8],A16:[-2.2,4.3,.7]};
function setupLabels(){for(const p of PARTS){const b=document.createElement('button');b.className='scene-label';b.innerHTML=`<span class="label-dot"></span><span>${p.short}</span><span class="label-code">${p.id}</span>`;b.onclick=()=>selectPart(p.id);b.title=p.name;labelNodes.set(p.id,b);$('labels').append(b);}}
function anchorFor(id){
 if(['A01','A03','A04','A13','A15'].includes(id)){const x=labelAnchors[id];return V(...x);}
 if(id==='A02'||id==='A14'||id==='A16'){const x=labelAnchors[id];const p=V(x[0],x[1]-1.8,x[2]);return antenna.azimuth.localToWorld(p);}
 let p;if(id==='A05')p=V(-3.9,-1.4,1.6);else p=V(...labelAnchors[id]);
 if(id==='A09'||id==='A10')p.z+=state.focus*.01;
 const g=antenna.byPart[id][0];const e=antenna.exploders.find(e=>e.group===g);if(e)p.addScaledVector(e.offset,state.explosion);
 return antenna.elevation.localToWorld(p);
}
function updateLabels(){
 const w=$('scene').clientWidth,h=$('scene').clientHeight;
 const wanted=new Set(state.isolated?[state.selected]:state.mode==='exterior'?['A01','A06','A08',state.selected]:['A03','A04','A05','A10','A11',state.selected]);
 if(w<600){wanted.clear();if(state.labels)wanted.add(state.selected);}
 const rectangles=[];
 const order=[state.selected,...[...wanted].filter(id=>id!==state.selected)];
 for(const [id,node] of labelNodes){node.hidden=true;node.classList.toggle('selected',id===state.selected);}
 for(const id of order){if(!wanted.has(id))continue;const node=labelNodes.get(id);const world=anchorFor(id),p=world.clone().project(camera),x=(p.x*.5+.5)*w,y=(-p.y*.5+.5)*h;
  const visible=state.labels&&p.z>-1&&p.z<1&&x>65&&x<w-90&&y>178&&y<h-63;
  if(!visible)continue;
  const box={x,y,w:Math.min(180,w-x-10),h:29};if(rectangles.some(r=>Math.abs(r.y-y)<28&&Math.abs(r.x-x)<180))continue;
  rectangles.push(box);node.hidden=false;node.style.left=x+'px';node.style.top=y+'px';
 }
 if(state.dimensions){const p=antenna.elevation.localToWorld(V(0,0,4.05)).project(camera);dimensionLabel.hidden=p.z<0||p.z>1||state.mode==='exploded';dimensionLabel.style.left=(p.x*.5+.5)*w-110+'px';dimensionLabel.style.top=(-p.y*.5+.5)*h-15+'px';}else dimensionLabel.hidden=true;
 const distance=camera.position.distanceTo(controls.target),metersPerPixel=2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/h;
 const length=metersPerPixel*60,unit=length>5?5:length>2?2:length>1?1:length>.5?.5:.2;
 document.querySelector('.scale-bar span').style.width=(unit/metersPerPixel)+'px';$('scale-label').textContent=String(unit).replace('.',',')+' m';
}
function motionChanged(){state.az=Number($('azimuth').value);state.el=Number($('elevation').value);state.focus=Number($('focus').value);updateMotionUI();}
function updateMotionUI(){$('azimuth-value').textContent=state.az.toFixed(1)+'°';$('elevation-value').textContent=state.el.toFixed(1)+'°';$('focus-value').textContent=(state.focus>0?'+':'')+state.focus+' mm';if(antenna){antenna.azimuth.rotation.y=THREE.MathUtils.degToRad(state.az);antenna.elevation.rotation.x=-THREE.MathUtils.degToRad(state.el);antenna.updateHex(state.focus);if(renderer)renderer.shadowMap.needsUpdate=true;}}
function resetMotion(){state.az=0;state.el=65;state.focus=0;state.animate=false;$('azimuth').value=0;$('elevation').value=65;$('focus').value=0;updateAnimationButton();updateMotionUI();}
function updateAnimationButton(){$('animate').innerHTML=state.animate?'<span>Ⅱ</span> Pausar':'<span>▶</span> Animar';$('animate').setAttribute('aria-pressed',String(state.animate));$('motion-status').textContent=state.animate?'CICLO DE DEMOSTRACIÓN':'SIMULACIÓN ILUSTRATIVA';}
function resize(){if(!renderer)return;const w=$('scene').clientWidth,h=$('scene').clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
function tick(now){requestAnimationFrame(tick);if(!renderer)return;const dt=Math.min((now-lastTime)/1000,.12)||.016;lastTime=now;
 if(state.animate){const t=now*.00018;state.az=Math.sin(t)*65;state.el=52+Math.sin(t*.73)*22;$('azimuth').value=state.az;$('elevation').value=state.el;updateMotionUI();}
 const desired=state.mode==='exploded'?1:0;state.explosion=THREE.MathUtils.damp(state.explosion,desired,5,dt);dimensionGroup.visible=state.dimensions&&state.mode!=='exploded';if(Math.abs(state.explosion-desired)>.001)renderer.shadowMap.needsUpdate=true;
 for(const e of antenna.exploders)e.group.position.copy(e.home).addScaledVector(e.offset,state.explosion);
 antenna.shutterHinge.rotation.y=THREE.MathUtils.damp(antenna.shutterHinge.rotation.y,state.shutterOpen?-Math.PI*.85:0,6,dt);
 if(focusTween){focusTween.t=Math.min(1,focusTween.t+dt*1.6);const a=focusTween.t,b=a*a*(3-2*a);camera.position.lerpVectors(focusTween.from,focusTween.to,b);controls.target.lerpVectors(focusTween.targetFrom,focusTween.targetTo,b);if(a===1)focusTween=null;}
 controls.update();antenna.root.updateMatrixWorld(true);renderer.render(scene,camera);
 if(drawCount++%3===0)updateLabels();
}
function picked(e){const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(antenna.meshes,false);return hits.find(h=>h.object.visible&&(state.mode!=='section'||clipPlane.distanceToPoint(h.point)>=0)&&(state.mode!=='xray'||!h.object.userData.shell||h.object.userData.part===state.selected))?.object.userData.part;}
function addEvents(){
 $('description-tab').onclick=()=>setInspectorTab('description');$('operation-tab').onclick=()=>setInspectorTab('operation');
 for(const id of ['description-tab','operation-tab'])$(id).onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'description':e.key==='End'?'operation':state.inspectorTab==='description'?'operation':'description';setInspectorTab(next);$(next+'-tab').focus();}};
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
 $('search').oninput=e=>renderList(e.target.value);
 $('sources-button').onclick=$('precision-button').onclick=()=>$('sources-dialog').showModal();$('help-button').onclick=()=>$('help-dialog').showModal();
 document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());for(const d of document.querySelectorAll('dialog'))d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
 $('focus-part').onclick=focusPart;$('isolate-part').onclick=()=>{state.isolated=!state.isolated;applyMaterials();updateInspector();if(state.isolated)focusPart();};
 $('prev-part').onclick=()=>{const i=PARTS.findIndex(p=>p.id===state.selected);selectPart(PARTS[(i+15)%16].id,true);};$('next-part').onclick=()=>{const i=PARTS.findIndex(p=>p.id===state.selected);selectPart(PARTS[(i+1)%16].id,true);};
 $('shutter-button').onclick=()=>{state.shutterOpen=!state.shutterOpen;$('shutter-button').textContent=state.shutterOpen?'Cerrar obturador':'Abrir obturador';};$('shutter-button').textContent='Cerrar obturador';
 $('home-view').onclick=()=>{state.isolated=false;applyMaterials();updateInspector();homeView();};
 for(const [id,key] of [['labels-toggle','labels'],['dimensions-toggle','dimensions'],['grid-toggle','grid']])$(id).onclick=()=>{state[key]=!state[key];$(id).classList.toggle('active',state[key]);$(id).setAttribute('aria-pressed',String(state[key]));if(key==='grid')grid.visible=state.grid;if(key==='dimensions'){dimensionGroup.visible=state.dimensions&&state.mode!=='exploded';if(state.mode==='exploded')toast('Las cotas se muestran en los modos ensamblados.');}};
 $('front-view').onclick=()=>{const direction=antenna.elevation.localToWorld(V(0,0,1)).sub(antenna.elevation.getWorldPosition(V())).normalize();const center=antenna.elevation.getWorldPosition(V());moveCamera(center.clone().addScaledVector(direction,23),center);};
 $('side-view').onclick=()=>moveCamera(V(24,6,0),V(0,5.5,0));$('top-view').onclick=()=>moveCamera(V(.01,29,.01),V(0,4,0));
 for(const id of ['azimuth','elevation','focus'])$(id).oninput=()=>{state.animate=false;updateAnimationButton();motionChanged();};
 $('animate').onclick=()=>{state.animate=!state.animate;updateAnimationButton();};$('reset-motion').onclick=resetMotion;
 $('capture').onclick=()=>{renderer.render(scene,camera);const c=document.createElement('canvas');c.width=renderer.domElement.width;c.height=renderer.domElement.height;const ctx=c.getContext('2d');ctx.fillStyle='#172630';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(renderer.domElement,0,0);const s=c.width/1100;ctx.font=`${Math.round(20*s)}px Segoe UI`;ctx.fillStyle='#c1dfd7';ctx.fillText('AEM / 12 m · ATLAS MECÁNICO',30*s,40*s);ctx.font=`${Math.round(12*s)}px Segoe UI`;ctx.fillStyle='#a4becb';ctx.fillText(`Reconstrucción técnica · ${state.mode} · AZ ${state.az.toFixed(1)}° / EL ${state.el.toFixed(1)}°`,30*s,c.height-27*s);const a=document.createElement('a');a.download='AEM-12m-'+state.mode+'.png';a.href=c.toDataURL('image/png');a.click();toast('Imagen PNG guardada.');};
 $('export-glb').onclick=async()=>{const b=$('export-glb');b.disabled=true;b.textContent='Preparando GLB…';try{const {GLTFExporter}=await import('./vendor/GLTFExporter.js');const clone=antenna.root.clone(true);clone.traverse(o=>{o.visible=true;if(o.isMesh){o.material=o.material.clone();o.material.clippingPlanes=[];o.material.opacity=o.userData.originalOpacity;o.material.transparent=o.userData.originalTransparent;o.material.depthWrite=o.userData.originalDepthWrite;o.material.color?.setHex(o.userData.originalColor);o.material.emissive?.set(0);}});for(let i=0;i<antenna.exploders.length;i++){const original=antenna.exploders[i];const cg=clone.getObjectByName(original.group.name);if(cg)cg.position.copy(original.home);}const dim=clone.getObjectByName('documented_primary_diameter');if(dim)dim.removeFromParent();clone.userData={units:'metres',scope:'Documented exterior; reconstructed internals, see specification.json',parameters:PARAMETERS,focusVisualMultiplier:10,azimuthDegrees:state.az,elevationDegrees:state.el};const buffer=await new GLTFExporter().parseAsync(clone,{binary:true,onlyVisible:false});download(new Blob([buffer],{type:'model/gltf-binary'}),'AEM-12m-reconstruccion.glb');toast('Modelo GLB exportado en metros.');}catch(e){console.error(e);toast('No se pudo exportar el GLB: '+e.message);}finally{b.disabled=false;b.textContent='↓ Exportar modelo GLB';}};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(state.isolated){state.isolated=false;applyMaterials();updateInspector();}$('inspector').classList.remove('mobile-open');}if(e.target.matches('input'))return;if(e.key==='/'){e.preventDefault();$('search').focus();}if(e.key.toLowerCase()==='h')homeView();});
 let down=null;renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};focusTween=null;});renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const id=picked(e);if(id)selectPart(id);else $('inspector').classList.remove('mobile-open');});renderer.domElement.addEventListener('dblclick',e=>{const id=picked(e);if(id){selectPart(id);focusPart();}});
 new ResizeObserver(resize).observe($('scene'));
}
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}

function init(){
 renderList();updateInspector();
 try{
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2('#14232e',.008);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor('#13212b',0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.localClippingEnabled=true;renderer.domElement.setAttribute('aria-label','Modelo 3D interactivo de la antena AEM de 12 metros');$('scene').append(renderer.domElement);
  camera=new THREE.PerspectiveCamera(37,1,.05,250);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=.6;controls.maxDistance=65;controls.maxPolarAngle=Math.PI*.97;controls.screenSpacePanning=true;controls.zoomSpeed=.85;controls.target.set(0,5.6,0);
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.65;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#e4f0ff','#304854',.95));const key=new THREE.DirectionalLight('#fff4df',2.8);key.position.set(8,18,12);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-11;key.shadow.camera.right=11;key.shadow.camera.top=14;key.shadow.camera.bottom=-9;key.shadow.camera.near=1;key.shadow.camera.far=60;key.shadow.normalBias=.035;key.shadow.bias=-.0001;key.shadow.radius=3;scene.add(key);const fill=new THREE.DirectionalLight('#a8d4f1',1.15);fill.position.set(-12,8,-8);scene.add(fill);const rimLight=new THREE.DirectionalLight('#d9ffff',1.4);rimLight.position.set(6,8,-10);scene.add(rimLight);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(160,160),new THREE.MeshBasicMaterial({color:'#14242e'}));ground.rotation.x=-Math.PI/2;ground.position.y=-.1;scene.add(ground);
  const groundShadow=new THREE.Mesh(new THREE.PlaneGeometry(45,45),new THREE.ShadowMaterial({color:'#030b12',opacity:.3}));groundShadow.rotation.x=-Math.PI/2;groundShadow.position.y=-.09;groundShadow.receiveShadow=true;scene.add(groundShadow);
  grid=new THREE.Group();const gridHelper=new THREE.GridHelper(40,40,'#36505d','#263c48');gridHelper.material.transparent=true;gridHelper.material.opacity=.5;gridHelper.position.y=-.085;grid.add(gridHelper);
  for(const r of [3.4,7.1]){const pts=[];for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;pts.push(V(Math.cos(a)*r,-.075,Math.sin(a)*r));}grid.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:r===3.4?'#4d7077':'#2b4855',transparent:true,opacity:.5})));}scene.add(grid);
  antenna=buildAntenna();scene.add(antenna.root);initDimensions();setupLabels();updateMotionUI();homeView(true);resize();applyMaterials();addEvents();$('loading').hidden=true;requestAnimationFrame(tick);
  // Read-only diagnostic contract for the included integration checks.
  const opticalBounds=new THREE.Box3();for(const p of antenna.panelObjects){p.geometry.computeBoundingBox();opticalBounds.union(p.geometry.boundingBox);}const aperture=opticalBounds.getSize(V());
  globalThis.AEM_DIAGNOSTICS=()=>({ready:true,webgl:renderer.capabilities.isWebGL2,mode:state.mode,selected:state.selected,isolated:state.isolated,azimuth:state.az,elevation:state.el,focus:state.focus,explosion:state.explosion,parts:PARTS.map(p=>({id:p.id,groups:antenna.byPart[p.id].length,meshes:antenna.meshes.filter(m=>m.userData.part===p.id).length})),panels:antenna.panelObjects.length,units:'m',parameters:PARAMETERS,aperture:aperture.toArray(),hexLegCount:antenna.hexLegs.length,AZrotation:antenna.azimuth.rotation.y,ELrotation:antenna.elevation.rotation.x,renderCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,sceneBounds:new THREE.Box3().setFromObject(antenna.root).getSize(V()).toArray(),hexPlatform:antenna.platform.position.z,cameraTransition:!!focusTween,cameraDistance:camera.position.distanceTo(controls.target)});
 }catch(e){console.error(e);$('loading').hidden=true;$('error-panel').hidden=false;}
}
init();
