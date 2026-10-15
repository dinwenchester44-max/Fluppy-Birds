const $=id=>document.getElementById(id),C=$('c'),X=C.getContext('2d'),W=400,H=700,GY=H-80,PW=62,R=13;
// Настройки экономики (можно менять)
const CFG={pipeCoin:1,every:10,bonus:5,record:20};
const RAR={c:['Обычные','#bdbdbd'],r:['Редкие','#42a5f5'],e:['Эпические','#ab47bc'],l:['Легендарные','#ffb300']};
const B=[
{n:'Классический Птенец',r:'c',p:0,c:'#ffd54f',w:'#ffb300',f:'#fff59d',a:'Способности нет — базовая птица для знакомства с игрой.'},
{n:'Лазурная Птица',r:'c',p:250,c:'#4fc3f7',w:'#0288d1',f:'#b3e5fc',a:'«Лёгкий взлёт»: пассивно — взмах мощнее на 12%.'},
{n:'Огненный Феникс',r:'r',p:700,c:'#ff7043',w:'#d84315',f:'#ffcc80',a:'«Второй шанс»: один раз за забег переживает столкновение.'},
{n:'Ледяной Сокол',r:'r',p:1200,c:'#b2ebf2',w:'#4dd0e1',f:'#ffffff',a:'«Ледяной импульс» (E): раз за забег замедляет трубы на 4 с.'},
{n:'Теневой Ворон',r:'e',p:2000,c:'#4a3a6a',w:'#2a1f45',f:'#7e57c2',a:'«Теневая фаза» (E): 2 с неуязвимость к трубам, перезарядка 12 с.'},
{n:'Золотой Орёл',r:'e',p:3500,c:'#ffca28',w:'#ff8f00',f:'#fff8e1',a:'«Золотой бонус»: пассивно +50% монет за пройденные трубы.'},
{n:'Космический Дракон',r:'l',p:6000,c:'#7c4dff',w:'#e040fb',f:'#18ffff',a:'«Космический рывок» (E): 1,2 с рывок с защитой, перезарядка 20 с.'}
];
const FX=['#ffd54f','#bbdefb','#ff9800','#e1f5fe','#b388ff','#fff176','#18ffff'];
// Сохранение
let S={coins:0,best:0,owned:[0],sel:0,mute:0};
try{const d=JSON.parse(localStorage.getItem('skyAdv')||'null');if(d)S=Object.assign(S,d)}catch(e){}
if(!Array.isArray(S.owned)||!S.owned.includes(0))S.owned=[0].concat(S.owned||[]);
if(!S.owned.includes(S.sel))S.sel=0;S.coins=Math.max(0,S.coins|0);
const save=()=>{try{localStorage.setItem('skyAdv',JSON.stringify(S))}catch(e){}};
// Звук
let AC;function beep(f,d=.08,ty='square',v=.04){if(S.mute)return;try{AC=AC||new AudioContext();const o=AC.createOscillator(),g=AC.createGain();o.type=ty;o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(AC.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.stop(AC.currentTime+d)}catch(e){}}
// Состояние
let mode='menu',paused=false,t=0,scroll=0,bird,pipes=[],parts=[],score=0,dist=0,runCoins=0,uses=0,earned=0,newRec=false,lastGy=300,ab={};
function initBird(){bird={x:W/2,y:330,vy:0,rot:0,wing:0,flap:0};pipes=[];parts=[]}
function reset(){initBird();bird.x=110;bird.y=300;score=0;dist=0;runCoins=0;uses=0;earned=0;newRec=false;lastGy=300;ab={used:0,cd:0,act:0,inv:0};mode='ready'}
initBird();
// Экраны
function showOv(id){['menu','shop','pause','over'].forEach(k=>$(k).classList.toggle('on',k===id))}
function ui(){$('mc').innerHTML='Монеты: <b>'+S.coins+'</b><br>Птица: <b>'+B[S.sel].n+'</b><br>Рекорд: <b>'+S.best+'</b>';$('snd').textContent='Звук: '+(S.mute?'выкл':'вкл')}
function toggleSnd(){S.mute=S.mute?0:1;save();ui()}
function play(){paused=false;reset();showOv(null);if(document.activeElement)document.activeElement.blur()}
function toMenu(){paused=false;initBird();mode='menu';shopCv=[];showOv('menu');ui()}
function togglePause(){if(mode!=='run'&&!paused)return;paused=!paused;showOv(paused?'pause':null)}
function toast(m){const e=$('toast');e.textContent=m;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),1900)}
// Магазин
let shopCv=[];
function openShop(){renderShop();showOv('shop')}
function renderShop(){
 let h='<h2>Магазин</h2><div>Монеты: <b>'+S.coins+'</b></div>';
 for(const k of['c','r','e','l']){
  h+='<div class="sec" style="color:'+RAR[k][1]+'">'+RAR[k][0]+'</div>';
  B.forEach((b,i)=>{if(b.r!==k)return;const own=S.owned.includes(i),cur=S.sel===i;
   h+='<div class="card"><canvas width="80" height="70" data-i="'+i+'"></canvas><div class="inf"><b>'+b.n+'</b><small>'+b.a+'</small>'+
   '<button class="btn sm '+(cur?'off':own?'g':'')+'" onclick="buy('+i+')">'+(cur?'Выбрано ✓':own?'Выбрать':'Купить — '+b.p+' монет')+'</button></div></div>'});
 }
 h+='<button class="btn b" onclick="toMenu()">Назад</button>';
 $('shop').innerHTML=h;
 shopCv=[...document.querySelectorAll('#shop canvas')].map(c=>[c.getContext('2d'),+c.dataset.i]);
}
function buy(i){
 if(S.owned.includes(i)){S.sel=i;save();renderShop();return}
 const b=B[i];
 if(S.coins<b.p){toast('Не хватает монет: нужно '+b.p);beep(200,.2,'sawtooth');return}
 if(!confirm('Купить «'+b.n+'» за '+b.p+' монет?'))return;
 S.coins-=b.p;S.owned.push(i);S.sel=i;save();beep(660,.1);setTimeout(()=>beep(880,.15),110);toast('Птица куплена!');renderShop();
}
// Эффекты
function burst(x,y,c,n){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=60+Math.random()*140;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:.6,c})}}
// Управление
function flap(){
 if(paused)return;
 if(mode==='ready')mode='run';
 if(mode!=='run')return;
 bird.vy=S.sel===1?-540:-480;bird.flap=.25;beep(520,.05);burst(bird.x-10,bird.y+8,'#ffffff',3);
}
function useAb(){
 if(mode!=='run'||paused)return;const id=S.sel;
 if(id===3&&!ab.used){ab.used=1;ab.act=4;burst(bird.x,bird.y,'#81d4fa',22)}
 else if(id===4&&ab.cd<=0){ab.act=2;ab.cd=12;burst(bird.x,bird.y,'#b388ff',22)}
 else if(id===6&&ab.cd<=0){ab.act=1.2;ab.cd=20;burst(bird.x,bird.y,'#18ffff',30)}
 else return;
 uses++;beep(700,.25,'sine',.06);
}
addEventListener('keydown',e=>{
 if(e.repeat)return;const k=e.code;
 if(k==='Space'||k==='ArrowUp'||k==='KeyW'){e.preventDefault();flap()}
 else if(k==='KeyE'||k==='ShiftLeft'||k==='ArrowDown'){useAb()}
 else if(k==='KeyP'||k==='Escape')togglePause();
});
C.addEventListener('pointerdown',e=>{
 const r=C.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;
 if(e.button===2){useAb();return}
 if(mode==='run'&&[3,4,6].includes(S.sel)&&Math.hypot(x-46,y-(H-40))<34){useAb();return}
 flap();
});
C.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='run'&&!paused)togglePause()});
function fit(){const s=Math.min(innerWidth/W,innerHeight/H);$('w').style.transform='scale('+s+')'}
addEventListener('resize',fit);fit();
// Игровая логика
function die(){
 mode='dead';bird.vy=-250;beep(150,.4,'sawtooth');burst(bird.x,bird.y,'#ffffff',22);
 newRec=score>S.best;if(newRec)S.best=score;
 earned=Math.floor(runCoins)+(newRec?CFG.record:0);S.coins+=earned;save();
 setTimeout(()=>{if(mode==='dead')showOver()},900);
}
function showOver(){
 $('over').innerHTML='<h2>Игра окончена</h2>'+(newRec?'<div class="rec">🏆 Новый рекорд! Поздравляем!</div>':'')+
 '<div style="font-size:20px;line-height:1.7">Счёт: <b>'+score+'</b><br>Лучший результат: <b>'+S.best+'</b><br>Дистанция: <b>'+Math.floor(dist/50)+' м</b><br>Пройдено препятствий: <b>'+score+'</b><br>Монеты за забег: <b>+'+earned+'</b><br>Способностей использовано: <b>'+uses+'</b></div>'+
 '<button class="btn g" onclick="play()">Играть снова</button><button class="btn b" onclick="toMenu()">В главное меню</button><button class="btn" onclick="openShop()">Магазин</button>';
 showOv('over');
}
function run(dt){
 const id=S.sel;let v=170+Math.min(score*3,110);
 if(id===3&&ab.act>0)v*=.5;if(id===6&&ab.act>0)v*=2.2;
 ab.act=Math.max(0,ab.act-dt);ab.cd=Math.max(0,ab.cd-dt);ab.inv=Math.max(0,ab.inv-dt);
 scroll+=v*dt;dist+=v*dt;
 bird.vy=Math.min(720,bird.vy+1500*dt);bird.y+=bird.vy*dt;
 bird.rot+=(Math.max(-.45,Math.min(1.4,bird.vy/500))-bird.rot)*Math.min(1,10*dt);
 if(bird.y<R){bird.y=R;if(bird.vy<0)bird.vy=0}
 // трубы
 const sp=Math.max(210,250-score*1.5);
 if(!pipes.length||pipes[pipes.length-1].x<W+40-sp){
  const g=Math.max(150,175-score*1.2),mn=60+g/2,mx=GY-60-g/2;
  lastGy=Math.max(mn,Math.min(mx,lastGy+(Math.random()-.5)*260));
  pipes.push({x:W+40,gy:lastGy,g,ok:0});
 }
 for(let i=pipes.length-1;i>=0;i--){
  const p=pipes[i];p.x-=v*dt;
  if(!p.ok&&p.x+PW<bird.x){ // флаг ok — очко и монеты ровно один раз за трубу
   p.ok=1;score++;runCoins+=CFG.pipeCoin*(id===5?1.5:1);
   if(score%CFG.every===0)runCoins+=CFG.bonus;
   beep(880,.06);if(id===5)burst(bird.x,bird.y,'#ffeb3b',8);
  }
  if(p.x<-PW-10)pipes.splice(i,1);
 }
 if(id>0&&Math.random()<.6)parts.push({x:bird.x-12,y:bird.y+(Math.random()-.5)*16,vx:-60-Math.random()*40,vy:(id===2?-50:id===3?30:0)+(Math.random()-.5)*30,l:.5,c:FX[id]});
 // столкновения
 const imm=ab.inv>0||((id===4||id===6)&&ab.act>0);
 let hit=null;
 for(const p of pipes)if(bird.x+R>p.x&&bird.x-R<p.x+PW&&(bird.y-R<p.gy-p.g/2||bird.y+R>p.gy+p.g/2)){hit=p;break}
 const gnd=bird.y+R>=GY;if(gnd)bird.y=GY-R;
 if((hit||gnd)&&!imm){
  if(id===2&&!ab.used){ab.used=1;ab.inv=1.5;uses++;bird.y=hit?hit.gy:GY-100;bird.vy=-300;burst(bird.x,bird.y,'#ff9800',26);beep(300,.25,'sawtooth')}
  else die();
 }else if(gnd){bird.vy=-380}
}
function update(dt){
 bird.wing+=dt*(bird.flap>0?30:12);bird.flap-=dt;
 for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;if(p.l<=0)parts.splice(i,1)}
 if(mode==='menu'){scroll+=60*dt;bird.x=W/2;bird.y=330+Math.sin(t*3)*10;bird.rot=0}
 else if(mode==='ready'){scroll+=60*dt;bird.y=300+Math.sin(t*5)*8}
 else if(mode==='run')run(dt);
 else if(mode==='dead'){bird.vy=Math.min(720,bird.vy+1500*dt);bird.y=Math.min(GY-R,bird.y+bird.vy*dt);bird.rot=Math.min(1.5,bird.rot+4*dt)}
}
// Отрисовка
function drawBird(c,id,x,y,rot,wing,al){
 const b=B[id];c.save();c.globalAlpha=al==null?1:al;c.translate(x,y);c.rotate(rot);
 if(id===2){c.fillStyle='#ffeb3b';c.beginPath();c.moveTo(-14,0);c.lineTo(-32,-10);c.lineTo(-28,2);c.lineTo(-34,12);c.lineTo(-14,6);c.fill()}
 if(id===4){c.fillStyle=b.w;c.beginPath();c.moveTo(-14,-2);c.lineTo(-30,-8);c.lineTo(-24,0);c.lineTo(-32,8);c.lineTo(-14,6);c.fill()}
 if(id===6){c.fillStyle=b.w;c.beginPath();c.moveTo(-14,0);c.lineTo(-34,6);c.lineTo(-14,8);c.fill()}
 c.fillStyle=b.c;c.beginPath();c.ellipse(0,0,19,14,0,0,7);c.fill();
 c.fillStyle=b.f;c.beginPath();c.ellipse(2,6,11,7,0,0,7);c.fill();
 c.save();c.translate(-5,2);c.rotate(Math.sin(wing)*.7-.2);c.fillStyle=b.w;c.beginPath();c.ellipse(-4,0,12,6,0,0,7);c.fill();c.restore();
 c.fillStyle='#fff';c.beginPath();c.arc(9,-5,5.5,0,7);c.fill();c.fillStyle='#111';c.beginPath();c.arc(11,-5,2.6,0,7);c.fill();
 c.fillStyle='#ff7043';c.beginPath();c.moveTo(16,-2);c.lineTo(27,2);c.lineTo(16,6);c.fill();
 if(id===3){c.fillStyle='#e1f5fe';c.beginPath();c.moveTo(-2,-13);c.lineTo(2,-24);c.lineTo(6,-13);c.lineTo(10,-22);c.lineTo(12,-11);c.fill()}
 if(id===5){c.fillStyle='#ffd600';c.beginPath();c.moveTo(0,-12);c.lineTo(2,-23);c.lineTo(7,-15);c.lineTo(12,-23);c.lineTo(14,-10);c.fill()}
 if(id===6){c.fillStyle='#18ffff';c.beginPath();c.moveTo(0,-12);c.lineTo(-4,-24);c.lineTo(6,-13);c.moveTo(8,-13);c.lineTo(12,-25);c.lineTo(14,-10);c.fill()}
 c.restore();
}
function txt(s,x,y,size,col,al){X.font='bold '+size+'px "Segoe UI",Arial';X.textAlign=al||'center';X.lineWidth=size/6;X.strokeStyle='#263238';X.lineJoin='round';X.strokeText(s,x,y);X.fillStyle=col||'#fff';X.fillText(s,x,y)}
function bg(){
 const g=X.createLinearGradient(0,0,0,GY);g.addColorStop(0,'#29b6f6');g.addColorStop(1,'#e1f5fe');X.fillStyle=g;X.fillRect(0,0,W,H);
 X.fillStyle='rgba(255,255,255,.85)';
 for(let i=0;i<5;i++){const x=(((i*170-scroll*.15)%680)+680)%680-140,y=[90,170,60,140,110][i];X.beginPath();X.arc(x,y,26,0,7);X.arc(x+28,y+6,20,0,7);X.arc(x-26,y+8,18,0,7);X.fill()}
 X.fillStyle='#8bc98e';
 for(let i=-1;i<4;i++){const x=i*220-(scroll*.3%220);X.beginPath();X.ellipse(x+110,GY,150,90,0,Math.PI,2*Math.PI);X.fill()}
}
function drawPipes(){
 for(const p of pipes){
  const t1=p.gy-p.g/2,b1=p.gy+p.g/2;
  X.fillStyle='#66bb6a';X.strokeStyle='#2e7d32';X.lineWidth=3;
  X.fillRect(p.x,-5,PW,t1-24);X.strokeRect(p.x,-5,PW,t1-24);
  X.fillRect(p.x-4,t1-24,PW+8,24);X.strokeRect(p.x-4,t1-24,PW+8,24);
  X.fillRect(p.x-4,b1,PW+8,24);X.strokeRect(p.x-4,b1,PW+8,24);
  X.fillRect(p.x,b1+24,PW,GY-b1-24);X.strokeRect(p.x,b1+24,PW,GY-b1-24);
  X.fillStyle='rgba(255,255,255,.25)';X.fillRect(p.x+8,-5,8,t1-24);X.fillRect(p.x+8,b1+24,8,GY-b1-24);
 }
}
function drawGround(){
 X.fillStyle='#d7b56d';X.fillRect(0,GY,W,80);X.fillStyle='#4caf50';X.fillRect(0,GY,W,14);X.fillStyle='#388e3c';X.fillRect(0,GY+14,W,5);
 X.fillStyle='#c9a55a';for(let x=-(scroll%40)-40;x<W+40;x+=40){X.fillRect(x,GY+34,20,10);X.fillRect(x+20,GY+56,20,10)}
}
function abHud(){
 const id=S.sel;if(id<2||id===5)return;const x=46,y=H-40,r=27;let ready,pct,tx;
 if(id===2){ready=!ab.used;pct=ready?1:0;tx=ready?'Шанс':'Исп.'}
 else if(id===3){ready=!ab.used;pct=ready?1:0;tx=ab.act>0?Math.ceil(ab.act):ready?'E':'—'}
 else{ready=ab.cd<=0;pct=1-ab.cd/(id===4?12:20);tx=ab.act>0?ab.act.toFixed(1):ready?'E':Math.ceil(ab.cd)}
 X.fillStyle='rgba(0,0,0,.5)';X.beginPath();X.arc(x,y,r,0,7);X.fill();
 X.lineWidth=5;X.strokeStyle=ab.act>0?'#ffee58':ready?'#66bb6a':'#90a4ae';X.beginPath();X.arc(x,y,r-3,-Math.PI/2,-Math.PI/2+6.283*pct);X.stroke();
 X.font='bold 15px "Segoe UI",Arial';X.textAlign='center';X.fillStyle='#fff';X.fillText(String(tx),x,y+5);
}
function hud(){
 txt(String(score),W/2,110,64);txt(Math.floor(dist/50)+' м',W/2,145,22);
 txt('Монеты: '+Math.floor(runCoins),12,28,18,'#ffee58','left');txt('Рекорд: '+S.best,12,52,16,'#fff','left');
 abHud();if(mode==='ready')txt('Нажми пробел или кликни',W/2,420,22);
}
function draw(){
 bg();drawPipes();drawGround();
 for(const p of parts){X.globalAlpha=Math.max(0,p.l*2);X.fillStyle=p.c;X.fillRect(p.x,p.y,4,4)}X.globalAlpha=1;
 const id=S.sel;let al=1;
 if(mode==='run'){if(id===4&&ab.act>0)al=.4;if(ab.inv>0&&Math.sin(t*35)>0)al=.45}
 if(mode==='run'&&ab.act>0&&id!==4){X.strokeStyle=FX[id];X.lineWidth=3;X.beginPath();X.arc(bird.x,bird.y,26,0,7);X.stroke()}
 drawBird(X,id,bird.x,bird.y,bird.rot,bird.wing,al);
 if(mode==='run'&&id===3&&ab.act>0){X.fillStyle='rgba(129,212,250,.16)';X.fillRect(0,0,W,H)}
 if(mode!=='menu')hud();
 if(shopCv.length)for(const[c,i]of shopCv){c.clearRect(0,0,80,70);drawBird(c,i,40,36,Math.sin(t*3)*.25,t*12,1);
  if(i>=2&&Math.random()<.3){c.fillStyle=FX[i];c.fillRect(10+Math.random()*60,Math.random()*66,3,3)}}
}
let last=0;
function loop(ts){
 const dt=Math.min(.033,(ts-last)/1000||0);last=ts;
 if(!paused){t+=dt;update(dt)}
 draw();requestAnimationFrame(loop);
}
ui();requestAnimationFrame(loop);
