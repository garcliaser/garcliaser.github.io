(()=>{
'use strict';
const API='https://xvebkbtfvvcjmzjjxysk.supabase.co/functions/v1/treino-garcia-api';
const nativeSet=Storage.prototype.setItem;
const nativeGet=Storage.prototype.getItem;
const nativeRemove=Storage.prototype.removeItem;
const gxDurationFixDate='2026-09-23T21:49:40.985Z';
function gxCorrectFirstDuration(value){
 try{
  if(typeof value!=='string'||!value.includes(gxDurationFixDate))return value;
  const list=JSON.parse(value);if(!Array.isArray(list))return value;
  let change=false;
  for(const session of list){
   if(session?.date===gxDurationFixDate&&Number(session.duration)>=11018000&&Number(session.duration)<=11024000){
    session.duration=4200000;change=true;
   }
  }
  return change?JSON.stringify(list):value;
 }catch(_){return value}
}
try{
 const originalHistory=localStorage.getItem('g_hist_A');
 if(originalHistory!=null){
  const correctedHistory=gxCorrectFirstDuration(originalHistory);
  if(originalHistory!==correctedHistory)nativeSet.call(localStorage,'g_hist_A',correctedHistory);
 }
}catch(_){}

let installPrompt=null;
const gxNativeFetch=window.fetch.bind(window);
let gxCloudVisual={state:'checking',text:'☁️ Verificando nuvem…'};
function ensureCloudBadge(){
 let e=document.getElementById('cloudSyncBadge');
 if(!e&&document.body){e=document.createElement('div');e.id='cloudSyncBadge';e.setAttribute('aria-live','polite');document.body.appendChild(e)}
 if(e){e.dataset.state=gxCloudVisual.state;e.textContent=gxCloudVisual.text;e.title='Status do salvamento do histórico na nuvem'}
 return e;
}
function cloudShow(state,text){gxCloudVisual={state,text};ensureCloudBadge()}
function cloudTime(iso){return new Date(iso||Date.now()).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
function cloudAction(init){try{const o=init?.body&&typeof init.body==='string'?JSON.parse(init.body):null;return o?.action||''}catch(_){return''}}
window.fetch=async function(input,init){
 const url=typeof input==='string'?input:(input?.url||''),isCloud=url.indexOf(API)===0,action=isCloud?cloudAction(init):'';
 if(isCloud){if(action==='push')cloudShow('saving','⏳ Salvando na nuvem…');else if(action==='pull')cloudShow('checking','☁️ Sincronizando…')}
 try{
  const r=await gxNativeFetch(input,init);
  if(isCloud){
   if(r.ok){
    if(action==='push'){const iso=setLastSync();cloudShow('ok','☁️ Sincronizado às '+cloudTime(iso))}
    else{const ls=lastSync();cloudShow('ok',ls?'☁️ Sincronizado às '+cloudTime(ls):'☁️ Nuvem conectada')}
   }else cloudShow('err','⚠️ Não sincronizado');
  }
  return r;
 }catch(e){if(isCloud)cloudShow(navigator.onLine?'err':'offline',navigator.onLine?'⚠️ Não sincronizado':'⚠️ Sem internet — salvo no aparelho');throw e}
};
window.addEventListener('offline',()=>cloudShow('offline','⚠️ Sem internet — salvo no aparelho'));
window.addEventListener('online',()=>cloudShow('checking','☁️ Internet voltou — sincronizando…'));

function n(v){const x=parseFloat(String(v??'').replace(',','.'));return Number.isFinite(x)?x:null}
function f(v,d=1){return v==null?'—':Number(v).toLocaleString('pt-BR',{maximumFractionDigits:d})}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function wk(){try{if(typeof cur!=='undefined'&&['A','B','C'].includes(cur))return cur}catch(_){}return localStorage.getItem('g_active')||localStorage.getItem('g_cur')||localStorage.getItem('g_next')||'A'}
function hist(w){try{return JSON.parse(localStorage.getItem('g_hist_'+w)||'[]')}catch(_){return[]}}
function allSessions(){const a=[];for(const w of ['A','B','C'])for(const s of hist(w))a.push({...s,workout:w});return a.sort((x,y)=>new Date(x.date)-new Date(y.date))}
function exMetric(e){if(!e)return null;const sets=e.sets||[];const ws=sets.map(s=>n(s.weightKg)).filter(x=>x!=null&&x>0);if(ws.length)return{v:Math.max(...ws),unit:'kg',kind:'peso'};const rs=sets.map(s=>n(s.reps)).filter(x=>x!=null);if(rs.length)return{v:Math.max(...rs),unit:e.type==='time'?'s':'reps',kind:e.type==='time'?'tempo':'reps'};return null}
function exName(id,e){return e?.performedName||id}
function duration(sec){sec=Math.max(0,Math.round(n(sec)||0));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60);return h?H(h)+'h '+H(m)+'min':H(m)+'min';function H(x){return String(x)}}
function dateBR(d){try{return new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}catch(_){return''}}
function curMonday(d=new Date()){const x=new Date(d);x.setHours(0,0,0,0);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x}
function currentWeek(){const start=curMonday(),end=new Date(start);end.setDate(end.getDate()+7);return allSessions().filter(s=>{const d=new Date(s.date);return d>=start&&d<end})}
function previousMetric(w,id,index){const h=hist(w);for(let i=index-1;i>=0;i--){const e=h[i]?.exercises?.[id],m=exMetric(e);if(m)return m}return null}
function sessionVolume(s){let total=0;for(const e of Object.values(s.exercises||{})){if(e?.type!=='reps')continue;for(const set of e.sets||[]){const kg=n(set.weightKg),reps=n(set.reps);if(kg!=null&&reps!=null)total+=kg*reps}}return total}
function bodyHistory(){try{return JSON.parse(localStorage.getItem('g_bodyweight_history')||'[]')}catch(_){return[]}}
function saveBody(date,kg){let a=bodyHistory().filter(x=>x.date!==date);a.push({date,kg});a.sort((x,y)=>x.date.localeCompare(y.date));localStorage.setItem('g_bodyweight_history',JSON.stringify(a.slice(-80)))}
function lastSync(){return localStorage.getItem('g_cloud_ui_last_sync')||''}
function setLastSync(){const iso=new Date().toISOString();localStorage.setItem('g_cloud_ui_last_sync',iso);return iso}
function syncText(){const x=lastSync();return x?'Último envio: '+new Date(x).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'Ainda sem envio confirmado nesta instalação.'}
function saveTokenFromHash(){try{const k=new URLSearchParams(location.hash.slice(1)).get('k');if(k&&k.length>20)localStorage.setItem('gx_cloud_token',k)}catch(_){}}
saveTokenFromHash();

function chartSvg(points){
 if(!points.length)return '<div class="gxMuted">Registre seu peso para o gráfico aparecer.</div>';
 const w=600,h=150,p=18,vals=points.map(x=>x.kg),mn=Math.min(...vals),mx=Math.max(...vals),range=Math.max(.5,mx-mn);
 const xy=points.map((x,i)=>{const px=p+(w-p*2)*(points.length===1?.5:i/(points.length-1));const py=h-p-(h-p*2)*(x.kg-mn)/range;return[px,py]});
 const path=xy.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
 const dots=xy.map((q,i)=>'<circle cx="'+q[0]+'" cy="'+q[1]+'" r="4"><title>'+dateBR(points[i].date)+' • '+f(points[i].kg)+' kg</title></circle>').join('');
 return '<svg class="gxChart" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" aria-label="Gráfico de peso corporal"><path d="'+path+'" fill="none" stroke="currentColor" stroke-width="4" vector-effect="non-scaling-stroke"/>'+dots+'</svg><div class="gxBetween gxMuted"><span>'+dateBR(points[0].date)+' • '+f(points[0].kg)+' kg</span><span>'+dateBR(points.at(-1).date)+' • '+f(points.at(-1).kg)+' kg</span></div>';
}

function weeklyStats(){
 const ws=currentWeek();let up=0,flat=0,down=0,comparisons=0,total=ws.reduce((a,s)=>a+(n(s.duration)||0),0);
 for(const s of ws){const h=hist(s.workout),idx=h.findIndex(x=>x.date===s.date);if(idx<0)continue;for(const [id,e] of Object.entries(s.exercises||{})){if(e?.type==='cardio')continue;const m=exMetric(e),p=previousMetric(s.workout,id,idx);if(!m||!p||m.unit!==p.unit)continue;comparisons++;const diff=m.v-p.v;if(diff>0.001)up++;else if(diff<-0.001)down++;else flat++}}
 return{count:ws.length,total,up,flat,down,comparisons};
}
function records(){
 const map=new Map();
 for(const s of allSessions())for(const [id,e] of Object.entries(s.exercises||{})){if(e?.type==='cardio')continue;const m=exMetric(e);if(!m)continue;const key=s.workout+':'+id;const old=map.get(key);if(!old||m.v>old.m.v)map.set(key,{w:s.workout,id,name:exName(id,e),m,date:s.date})}
 return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
}
function stagnations(){
 const out=[];
 for(const w of ['A','B','C']){const h=hist(w);const ids=new Set();h.forEach(s=>Object.keys(s.exercises||{}).forEach(id=>ids.add(id)));
  ids.forEach(id=>{const a=[];for(let i=0;i<h.length;i++){if(h[i]?.fatigueMode)continue;const e=h[i]?.exercises?.[id],m=exMetric(e);if(m)a.push({m,e,date:h[i].date})}if(a.length<3)return;const z=a.slice(-3);if(z.every(x=>x.m.unit===z[0].m.unit)){const base=z[0].m.v;const progressed=z.slice(1).some(x=>x.m.v>base+0.001);if(!progressed)out.push({w,id,name:exName(id,z.at(-1).e),m:z.at(-1).m})}})
 }
 return out;
}
function newPRs(w,session){
 const h=hist(w),idx=h.findIndex(x=>x.date===session.date),prs=[];for(const [id,e] of Object.entries(session.exercises||{})){if(e?.type==='cardio')continue;const m=exMetric(e);if(!m)continue;let best=-Infinity;for(let i=0;i<idx;i++){const pm=exMetric(h[i]?.exercises?.[id]);if(pm&&pm.unit===m.unit)best=Math.max(best,pm.v)}if(best>-Infinity&&m.v>best+0.001)prs.push(exName(id,e));if(best===-Infinity)prs.push(exName(id,e))}
 return prs;
}

function injectBase(){
 if(document.getElementById('gxPanelBtn'))return;
 const b=document.createElement('button');b.id='gxPanelBtn';b.textContent='📊 Painel';b.onclick=openPanel;document.body.appendChild(b);
 const o=document.createElement('div');o.id='gxOverlay';o.innerHTML='<div id="gxSheet"></div>';o.addEventListener('click',e=>{if(e.target===o)closePanel()});document.body.appendChild(o);
 const s=document.createElement('div');s.id='gxSummary';s.innerHTML='<div id="gxSummaryCard"></div>';s.addEventListener('click',e=>{if(e.target===s)s.classList.remove('open')});document.body.appendChild(s);
 showFatigueBanner();
}
function closePanel(){document.getElementById('gxOverlay')?.classList.remove('open')}
function openPanel(){
 injectBase();
 const w=wk(),bw=bodyHistory(),week=weeklyStats(),recs=records().slice(-12),st=stagnations(),fat=fatigueState(w),today=new Date().toISOString().slice(0,10),note=localStorage.getItem('g_session_note_'+w)||'',pain=localStorage.getItem('g_session_pain_'+w)||'0',loc=localStorage.getItem('g_session_painloc_'+w)||'';
 const installStandalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const installLabel=installStandalone?'✓ Instalado':'📲 Instalar como app';
 document.getElementById('gxSheet').innerHTML=
 '<div class="gxHead"><h2>📊 Painel do treino</h2><button class="gxClose" id="gxClose">Fechar</button></div>'+
 '<div class="gxGrid">'+
  '<div class="gxCard"><h3>☁️ Nuvem</h3><div class="gxMuted" id="gxCloudInfo">'+esc(syncText())+'</div><div class="gxRow" style="margin-top:10px"><button class="gxBtn primary" id="gxForceSync">Sincronizar agora</button><button class="gxBtn" id="gxInstall" '+(installStandalone?'disabled':'')+'>'+installLabel+'</button></div></div>'+
  '<div class="gxCard"><h3>📅 Esta semana</h3><div class="gxBig">'+week.count+' treino'+(week.count===1?'':'s')+'</div><div class="gxMuted">'+duration(week.total)+' registrados</div><div class="gxRow" style="margin-top:8px"><span class="gxPill gxGood">↑ '+week.up+' evoluíram</span><span class="gxPill">→ '+week.flat+' estáveis</span><span class="gxPill gxBad">↓ '+week.down+' caíram</span></div></div>'+
 '</div>'+
 '<div class="gxCard"><h3>⚖️ Peso corporal semanal</h3><div class="gxRow"><div style="flex:1;min-width:150px"><label class="gxLabel">Data</label><input class="gxInput" id="gxBwDate" type="date" value="'+today+'"></div><div style="flex:1;min-width:130px"><label class="gxLabel">Peso (kg)</label><input class="gxInput" id="gxBwKg" inputmode="decimal" placeholder="ex.: 78,4"></div><div style="align-self:end"><button class="gxBtn primary" id="gxSaveBw">Salvar</button></div></div><div style="margin-top:12px">'+chartSvg(bw.slice(-12))+'</div></div>'+
 '<div class="gxCard"><h3>📝 Observação do treino atual — '+w+'</h3><label class="gxLabel">Nota rápida</label><textarea class="gxText" id="gxNote" placeholder="Ex.: pegada cansou, máquina diferente, dormi pouco...">'+esc(note)+'</textarea><div class="gxGrid"><div><label class="gxLabel">Dor/incômodo 0–10</label><select class="gxSelect" id="gxPain">'+Array.from({length:11},(_,i)=>'<option value="'+i+'" '+(String(i)===String(pain)?'selected':'')+'>'+i+'</option>').join('')+'</select></div><div><label class="gxLabel">Local (opcional)</label><input class="gxInput" id="gxPainLoc" value="'+esc(loc)+'" placeholder="Ex.: joelho direito"></div></div><div class="gxMuted" style="margin-top:8px">Fica anexado ao treino quando você finalizar.</div></div>'+
 '<div class="gxCard"><h3>😴 Dia de baixa energia</h3><div class="gxMuted">Reduz só as cargas desta sessão. Sessões marcadas assim ficam fora da lógica automática de progressão.</div><div class="gxRow" style="margin-top:10px"><select class="gxSelect" id="gxFatPct" style="width:auto"><option value="5">−5%</option><option value="7.5" selected>−7,5%</option><option value="10">−10%</option></select>'+(fat?.active?'<button class="gxBtn warn" id="gxRestoreFat">Restaurar cargas normais</button>':'<button class="gxBtn warn" id="gxApplyFat">Hoje estou cansado</button>')+'</div></div>'+
 '<div class="gxGrid">'+
  '<div class="gxCard"><h3>🏆 Recordes pessoais</h3><div class="gxList">'+(recs.length?recs.map(r=>'<div class="gxItem"><span>Treino '+r.w+' • '+esc(r.name)+'</span><b>'+f(r.m.v)+' '+r.m.unit+'</b></div>').join(''):'<div class="gxMuted">Ainda sem histórico suficiente.</div>')+'</div></div>'+
  '<div class="gxCard"><h3>🧭 Estagnação</h3><div class="gxList">'+(st.length?st.slice(0,8).map(x=>'<div class="gxItem"><span>Treino '+x.w+' • '+esc(x.name)+'</span><span class="gxWarn">3 sessões sem avanço</span></div>').join(''):'<div class="gxMuted">Nenhum exercício com 3 sessões seguidas sem progresso detectado.</div>')+'</div></div>'+
 '</div>';
 document.getElementById('gxOverlay').classList.add('open');
 document.getElementById('gxClose').onclick=closePanel;
 document.getElementById('gxForceSync').onclick=forceSync;
 document.getElementById('gxInstall').onclick=installApp;
 document.getElementById('gxSaveBw').onclick=()=>{const d=document.getElementById('gxBwDate').value,kg=n(document.getElementById('gxBwKg').value);if(!d||kg==null||kg<30||kg>300){alert('Confira a data e o peso em kg.');return}saveBody(d,kg);openPanel();try{forceSync()}catch(_){}};
 for(const id of ['gxNote','gxPain','gxPainLoc'])document.getElementById(id).addEventListener(id==='gxNote'?'input':'change',()=>{
   localStorage.setItem('g_session_note_'+w,document.getElementById('gxNote').value);
   localStorage.setItem('g_session_pain_'+w,document.getElementById('gxPain').value);
   localStorage.setItem('g_session_painloc_'+w,document.getElementById('gxPainLoc').value);
 });
 document.getElementById('gxApplyFat')?.addEventListener('click',()=>{applyFatigue(w,n(document.getElementById('gxFatPct').value)||7.5);openPanel()});
 document.getElementById('gxRestoreFat')?.addEventListener('click',()=>{restoreFatigue(w);openPanel()});
}
async function forceSync(){
 const info=document.getElementById('gxCloudInfo');if(info)info.textContent='Enviando agora…';
 try{
   try{if(typeof cloudPushNow==='function'){await cloudPushNow(true);setLastSync();if(info)info.textContent=syncText();return}}catch(_){}
   const token=localStorage.getItem('gx_cloud_token');if(!token)throw new Error('Abra uma vez o link pessoal completo com #k= para ativar este aparelho.');
   const state={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith('g_'))state[k]=localStorage.getItem(k)}
   const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','X-Sync-Token':token},body:JSON.stringify({action:'push',state,client_updated_at:new Date().toISOString()})});
   if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.error||'Falha na sincronização')}
   setLastSync();if(info)info.textContent=syncText();
 }catch(e){if(info)info.textContent='⚠️ '+e.message;throw e}
}
async function installApp(){
 if(matchMedia('(display-mode: standalone)').matches||navigator.standalone===true){alert('O Treino 3x já está instalado.');return}
 if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;return}
 const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
 alert(ios?'No iPhone/iPad: toque em Compartilhar → Adicionar à Tela de Início.':'No navegador, abra o menu ⋮ e escolha “Instalar app” ou “Adicionar à tela inicial”.');
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e});

function fatigueState(w){try{return JSON.parse(localStorage.getItem('g_fatigue_mode_'+w)||'null')}catch(_){return null}}
function isLoadKey(key,w){return key.startsWith('g_target_'+w+'_')||(key.startsWith('g_set_'+w+'_')&&key.endsWith('_weight'))}
function reduced(v,pct){const x=n(v);return x==null?v:String(Math.max(0,Math.round((x*(1-pct/100))*10)/10))}
function applyFatigue(w,pct){
 if(fatigueState(w)?.active)return;
 const st={active:true,pct,backups:{},started:new Date().toISOString()};
 for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&isLoadKey(k,w)){const v=n(localStorage.getItem(k));if(v!=null&&v>0){st.backups[k]=localStorage.getItem(k);nativeSet.call(localStorage,k,reduced(v,pct))}}}
 nativeSet.call(localStorage,'g_fatigue_mode_'+w,JSON.stringify(st));showFatigueBanner();safeRender();
}
function restoreFatigue(w){
 const st=fatigueState(w);if(!st)return;
 for(const [k,v] of Object.entries(st.backups||{}))nativeSet.call(localStorage,k,String(v));
 nativeRemove.call(localStorage,'g_fatigue_mode_'+w);showFatigueBanner();safeRender();
}
function showFatigueBanner(){
 document.getElementById('gxFatigueBanner')?.remove();const w=wk(),st=fatigueState(w);if(!st?.active)return;
 const e=document.createElement('div');e.id='gxFatigueBanner';e.className='gxFatigueBanner';e.textContent='😴 Modo cansado: −'+f(st.pct)+'% nesta sessão';e.onclick=openPanel;document.body?.appendChild(e);
}
function safeRender(){try{if(typeof render==='function')render()}catch(_){}}

function showSummary(w,s){
 const card=document.getElementById('gxSummaryCard');if(!card)return;
 const h=hist(w),idx=h.findIndex(x=>x.date===s.date);let up=0,flat=0,down=0;
 for(const [id,e] of Object.entries(s.exercises||{})){if(e?.type==='cardio')continue;const m=exMetric(e),p=previousMetric(w,id,idx);if(!m||!p||m.unit!==p.unit)continue;if(m.v>p.v+.001)up++;else if(m.v<p.v-.001)down++;else flat++}
 const prs=newPRs(w,s),vol=sessionVolume(s),note=s.notes?.text||'',pain=n(s.notes?.pain)||0;
 card.innerHTML='<div class="gxBetween"><h2 style="margin:0">✅ Treino '+w+' concluído</h2><button class="gxClose" id="gxSummaryClose">Fechar</button></div>'+
 '<div class="gxGrid" style="margin-top:12px"><div class="gxCard"><div class="gxMuted">Duração</div><div class="gxBig">'+duration(s.duration)+'</div></div><div class="gxCard"><div class="gxMuted">Tonelagem registrada aprox.</div><div class="gxBig">'+(vol?f(vol/1000)+' t':'—')+'</div></div></div>'+
 '<div class="gxCard"><h3>Comparação com a última sessão</h3><div class="gxRow"><span class="gxPill gxGood">↑ '+up+'</span><span class="gxPill">→ '+flat+'</span><span class="gxPill gxBad">↓ '+down+'</span></div></div>'+
 (prs.length?'<div class="gxCard"><h3>🏆 Recordes desta sessão</h3><div>'+prs.map(esc).join(' • ')+'</div></div>':'')+
 (s.fatigueMode?'<div class="gxCard"><b>😴 Sessão de baixa energia</b><div class="gxMuted">Marcada para não interferir na lógica automática de progressão.</div></div>':'')+
 ((note||pain)?'<div class="gxCard"><h3>📝 Registro</h3>'+(note?'<div>'+esc(note)+'</div>':'')+(pain?'<div class="gxMuted" style="margin-top:6px">Dor/incômodo: '+pain+'/10'+(s.notes?.location?' • '+esc(s.notes.location):'')+'</div>':'')+'</div>':'')+
 '<div class="gxMuted">O histórico completo continua disponível na aba Histórico.</div>';
 document.getElementById('gxSummary').classList.add('open');document.getElementById('gxSummaryClose').onclick=()=>document.getElementById('gxSummary').classList.remove('open');
}

Storage.prototype.setItem=function(key,value){
 key=String(key);
 if(key==='g_hist_A')value=gxCorrectFirstDuration(String(value));
 const hm=key.match(/^g_hist_([ABC])$/);
 let summary=null;
 if(hm){
   const w=hm[1],oldArr=(()=>{try{return JSON.parse(nativeGet.call(this,key)||'[]')}catch(_){return[]}})();
   try{
     const arr=JSON.parse(String(value));const active=nativeGet.call(this,'g_active')===w;
     if(active&&arr.length===oldArr.length+1){
       const rec=arr[arr.length-1],note=nativeGet.call(this,'g_session_note_'+w)||'',pain=nativeGet.call(this,'g_session_pain_'+w)||'0',loc=nativeGet.call(this,'g_session_painloc_'+w)||'',fat=fatigueState(w);
       if(note||n(pain)>0||loc)rec.notes={text:note,pain,location:loc};
       if(fat?.active)rec.fatigueMode={pct:fat.pct,started:fat.started};
       value=JSON.stringify(arr);summary=rec;
     }
   }catch(_){}
 }
 const wm=key.match(/^g_(?:target|set)_([ABC])_/);
 if(wm&&isLoadKey(key,wm[1])){
   const st=fatigueState(wm[1]),x=n(value);
   if(st?.active&&x!=null&&x>0&&!(key in (st.backups||{}))){
     st.backups[key]=String(value);nativeSet.call(this,'g_fatigue_mode_'+wm[1],JSON.stringify(st));value=reduced(value,st.pct);
   }
 }
 nativeSet.call(this,key,String(value));
 if(summary&&hm){
   const w=hm[1];nativeRemove.call(this,'g_session_note_'+w);nativeRemove.call(this,'g_session_pain_'+w);nativeRemove.call(this,'g_session_painloc_'+w);nativeRemove.call(this,'g_fatigue_mode_'+w);
   setTimeout(()=>{showFatigueBanner();showSummary(w,summary)},700);
 }
};

function init(){
 injectBase();ensureCloudBadge();
 if(!navigator.onLine)cloudShow('offline','⚠️ Sem internet — salvo no aparelho');else{const ls=lastSync();cloudShow(ls?'ok':'checking',ls?'☁️ Sincronizado às '+cloudTime(ls):'☁️ Verificando nuvem…')}
 if('serviceWorker'in navigator)navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
 setInterval(()=>{const b=document.getElementById('gxPanelBtn');if(!b)injectBase();showFatigueBanner()},15000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();