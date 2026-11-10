const express=require('express'),multer=require('multer'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {spawn}=require('child_process');
const FF=process.env.FFMPEG||'ffmpeg',FP=process.env.FFPROBE||'ffprobe',PY=process.env.PYTHON||'python3',MODEL=process.env.WHISPER_MODEL||'small';
const D=path.join(__dirname,'data');for(const d of['uploads','exports','work'])fs.mkdirSync(path.join(D,d),{recursive:true});
const DBF=path.join(D,'db.json');let db=fs.existsSync(DBF)?JSON.parse(fs.readFileSync(DBF)):{projects:[]};
db.projects.forEach(p=>{if(['analyzing'].includes(p.status))p.status='error',p.error='Server restarted';(p.exports||[]).forEach(e=>{if(e.status==='processing')e.status='error',e.error='Server restarted'})});
const save=()=>fs.writeFileSync(DBF,JSON.stringify(db));
const id=()=>crypto.randomBytes(5).toString('hex');
const run=(cmd,args,o={})=>new Promise((res,rej)=>{const p=spawn(cmd,args,{cwd:o.cwd});let so='',se='';p.stdout.on('data',d=>so+=d);p.stderr.on('data',d=>se+=d);p.on('error',e=>rej(new Error(cmd+' not available: '+e.message)));p.on('close',c=>c===0||o.ok?res({so,se}):rej(new Error(se.slice(-500)||'exit '+c)))});
// ---- 30 caption templates: name, mode(line|word|karaoke|highlight), font, color, highlight, outline, bold, upper, size, box
const T=[
['Hormozi Pop','word','Impact','#FFFFFF','#FFE500','#000000',1,1,72],['Viral Yellow','highlight','Impact','#FFFFFF','#FFE500','#000000',1,1,64],['Karaoke Purple','karaoke','Arial','#FFFFFF','#A855F7','#000000',1,1,58],['Podcast Clean','line','Arial','#FFFFFF','#FFFFFF','#000000',0,0,44],['Podcast Box','line','Arial','#FFFFFF','#FFFFFF','#000000',1,0,44,1],
['Neon Green','highlight','Impact','#FFFFFF','#39FF14','#000000',1,1,64],['Minimal White','line','Helvetica','#FFFFFF','#FFFFFF','#222222',0,0,40],['Bold Red','word','Impact','#FFFFFF','#FF2D2D','#000000',1,1,72],['Cinema','line','Georgia','#F5F5DC','#F5F5DC','#000000',0,0,42],['Cyber Cyan','highlight','Arial','#FFFFFF','#00E5FF','#001018',1,1,56],
['Sunset','karaoke','Arial','#FFD1A9','#FF6B35','#2B0A00',1,0,56],['Royal Gold','highlight','Georgia','#FFFFFF','#FFC107','#1A1200',1,0,56],['Shorts Classic','line','Impact','#FFFFFF','#FFFFFF','#000000',1,1,60],['Pink Pop','word','Arial','#FFFFFF','#FF4FA3','#3A0020',1,1,68],['Ice Blue','karaoke','Arial','#E8F6FF','#38BDF8','#001B2E',1,0,54],
['Black Box','line','Arial','#FFFFFF','#FFFFFF','#000000',1,0,46,1],['Purple Box','highlight','Arial','#FFFFFF','#C084FC','#000000',1,1,50,1],['Retro','word','Courier New','#FFEB99','#FF7A59','#2B1B00',1,1,56],['News','line','Arial','#FFFFFF','#FFFFFF','#0A2A66',1,0,42,1],['Comic','word','Comic Sans MS','#FFFFFF','#FFEA00','#000000',1,1,66],
['Elegant','line','Georgia','#FFFFFF','#E9D5FF','#2A0A4A',0,0,44],['Fire','highlight','Impact','#FFF3B0','#FF5A00','#300000',1,1,66],['Matrix','karaoke','Courier New','#B6FFB6','#00FF41','#001A00',1,0,50],['Bubble','word','Arial','#FFFFFF','#7C3AED','#FFFFFF',1,1,66],['Subtle Pro','line','Helvetica','#EDEDED','#EDEDED','#111111',0,0,38],
['Big Impact','word','Impact','#FFFFFF','#FFFFFF','#000000',1,1,84],['Lime Karaoke','karaoke','Arial','#FFFFFF','#B5FF2E','#0A1A00',1,1,58],['Mono','highlight','Courier New','#FFFFFF','#FFFFFF','#000000',1,0,50],['Storyteller','line','Georgia','#FFF8E7','#FFF8E7','#000000',0,0,46],['Tech Blue','highlight','Arial','#FFFFFF','#3B82F6','#00112E',1,1,56]
].map(([name,mode,font,color,hl,outline,bold,upper,size,box],i)=>({id:i,name,mode,font,color,hl,outline,bold:!!bold,upper:!!upper,size,box:!!box,y:0.78}));
const hex=(c,a='00')=>{c=c.replace('#','');return('&H'+a+c.slice(4,6)+c.slice(2,4)+c.slice(0,2)).toUpperCase()};
const ts=t=>{t=Math.max(0,t);return`${Math.floor(t/3600)}:${String(Math.floor(t%3600/60)).padStart(2,'0')}:${(t%60).toFixed(2).padStart(5,'0')}`};
function makeAss(words,st,W,H){
 const k=W/1080,fs=Math.round(st.size*k),base=hex(st.color),hl=hex(st.hl),ol=hex(st.outline),bg=hex('#000000',st.box?'50':'90');
 const sty=(n,p,s)=>`Style: ${n},${st.font},${fs},${p},${s},${ol},${bg},${st.bold?-1:0},0,0,0,100,100,0,0,${st.box?3:1},${Math.round(4*k)},${st.box?0:Math.round(2*k)},2,40,40,40,1`;
 let o=`[Script Info]\nScriptType: v4.00+\nPlayResX: ${W}\nPlayResY: ${H}\n\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\n${sty('D',base,hl)}\n${sty('K',hl,base)}\n\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n`;
 const pos=`{\\an2\\pos(${Math.round(W/2)},${Math.round(H*st.y)})}`,esc=s=>(st.upper?s.toUpperCase():s).replace(/[{}\\]/g,'').replace(/\n/g,' ');
 const per=st.mode==='word'?1:(H>W?3:5),ch=[];for(let i=0;i<words.length;i+=per)ch.push(words.slice(i,i+per));
 const ev=(s,e,sy,t)=>{o+=`Dialogue: 0,${ts(s)},${ts(Math.max(e,s+0.05))},${sy},,0,0,0,,${pos}${t}\n`};
 for(const c of ch){const s0=c[0].s,e0=c[c.length-1].e;
  if(st.mode==='line')ev(s0,e0,'D',c.map(w=>esc(w.w)).join(' '));
  else if(st.mode==='word')c.forEach((w,i)=>ev(w.s,Math.max(w.e,w.s+0.25),'D',`{\\fscx70\\fscy70\\t(0,90,\\fscx100\\fscy100)\\1c${hl}}${esc(w.w)}`));
  else if(st.mode==='karaoke'){let t=s0,x='';for(const w of c){if(w.s>t+0.02)x+=`{\\k${Math.round((w.s-t)*100)}}`;x+=`{\\kf${Math.max(1,Math.round((w.e-w.s)*100))}}${esc(w.w)} `;t=w.e}ev(s0,e0,'K',x.trim())}
  else c.forEach((w,i)=>ev(w.s,i<c.length-1?c[i+1].s:w.e,'D',c.map((v,j)=>j===i?`{\\1c${hl}}${esc(v.w)}{\\1c${base}}`:esc(v.w)).join(' ')));}
 return o}
// ---- analysis
function pick(words,dur,L,n){
 const HOOK=/^(secret|never|always|why|how|mistake|truth|best|worst|money|free|stop|biggest|crazy|amazing|important|warning|dont|don't|you|kyun|kaise|raaz|sach|kabhi)\W*$/i,C=[];
 for(let s=0;s+L*0.5<dur;s+=Math.max(3,L/6)){const e=Math.min(dur,s+L),ws=words.filter(w=>w.s>=s&&w.e<=e);if(ws.length<4)continue;
  let gaps=0;for(let i=1;i<ws.length;i++)if(ws[i].s-ws[i-1].e>1.2)gaps++;
  const prev=words[words.indexOf(ws[0])-1],sb=!prev||/[.?!]$/.test(prev.w)?3:0;
  C.push({s:ws[0].s,e:ws[ws.length-1].e,raw:ws.length/(e-s)*10+ws.filter(w=>HOOK.test(w.w)).length*2+ws.filter(w=>/[?!]$/.test(w.w)).length*1.5-gaps*3+sb});}
 C.sort((a,b)=>b.raw-a.raw);const out=[];for(const c of C){if(out.length>=n)break;if(out.every(o=>c.e<=o.s||c.s>=o.e))out.push(c)}
 const mx=Math.max(...out.map(o=>o.raw),1);return out.map(o=>({...o,score:Math.max(40,Math.min(99,Math.round(o.raw/mx*60+38)))})).sort((a,b)=>a.s-b.s)}
const find=(pid)=>db.projects.find(p=>p.id===pid);
async function analyze(p,lang,L,n){
 try{p.status='analyzing';p.error=null;p.warning=null;save();
  const wav=path.join(D,'work',p.id+'.wav');await run(FF,['-y','-i',p.file,'-vn','-ac','1','-ar','16000',wav]);
  let words=[];try{const r=await run(PY,[path.join(__dirname,'transcribe.py'),wav,lang,MODEL]);words=JSON.parse(r.so.trim().split('\n').pop())}catch(e){p.warning='Speech recognition unavailable ('+e.message.slice(0,120)+'). Install faster-whisper for captions & smart moment detection. Clips were split evenly.'}
  p.words=words;let picks;
  if(words.length>5)picks=pick(words,p.duration,L,n);else{picks=[];const cnt=Math.min(n,Math.max(1,Math.floor(p.duration/L)));for(let i=0;i<cnt;i++){const s=i*p.duration/cnt;picks.push({s,e:Math.min(p.duration,s+L),score:50})}}
  p.clips=picks.map((c,i)=>{const ws=words.filter(w=>w.s>=c.s-0.01&&w.e<=c.e+0.01);return{id:id(),title:ws.slice(0,7).map(w=>w.w).join(' ')||'Clip '+(i+1),start:+c.s.toFixed(2),end:+c.e.toFixed(2),score:c.score,words:ws,ratio:'9:16',removeSilence:true,track:true,style:{...T[0],y:0.78}}});
  p.status='ready';fs.rmSync(wav,{force:true})}catch(e){p.status='error';p.error=e.message}save()}
// ---- export
const RAT={'9:16':[1080,1920],'16:9':[1920,1080],'1:1':[1080,1080]};
async function doExport(p,c,ex){
 try{const [tw,th]=RAT[c.ratio]||RAT['9:16'],dur=c.end-c.start,W=p.width,H=p.height,ar=tw/th,wd=path.join(D,'work');
  let keeps=null;
  if(c.removeSilence&&p.hasAudio){const r=await run(FF,['-ss',String(c.start),'-t',String(dur),'-i',p.file,'-af','silencedetect=noise=-35dB:d=0.6','-f','null','-'],{ok:true});
   const sil=[];let cur=null;for(const l of r.se.split('\n')){let m;if(m=l.match(/silence_start: ([\d.]+)/))cur=+m[1];m=l.match(/silence_end: ([\d.]+)/);if(m&&cur!==null){sil.push([cur,+m[1]]);cur=null}}
   if(cur!==null)sil.push([cur,dur]);keeps=[];let t=0;for(const [a,b] of sil){const ka=a+0.15;if(ka-t>0.2)keeps.push([t,ka]);t=Math.max(t,b-0.15)}if(dur-t>0.2)keeps.push([t,dur]);if(!sil.length||!keeps.length)keeps=null}
  const mp=t=>{let acc=0;for(const [a,b] of keeps){if(t<a)return acc;if(t<=b)return acc+t-a;acc+=b-a}return acc};
  let ws=c.words.map(w=>({w:w.w,s:w.s-c.start,e:w.e-c.start})).filter(w=>w.e>0&&w.s<dur);
  if(keeps)ws=ws.filter(w=>keeps.some(([a,b])=>w.s>=a-0.05&&w.s<=b)).map(w=>({w:w.w,s:mp(w.s),e:mp(w.e)}));
  let cx=0.5;if(c.track&&c.ratio!=='16:9'&&W/H>ar){try{cx=parseFloat((await run(PY,[path.join(__dirname,'track.py'),p.file,String(c.start),String(c.end)])).so)||0.5}catch(e){ex.note='Speaker tracking unavailable (install opencv-python-headless); used center crop.'}}
  const ev=n=>2*Math.floor(n/2),cw=ev(Math.min(W,H*ar)),chh=ev(Math.min(H,W/ar)),x=Math.round(Math.max(0,Math.min(W-cw,cx*W-cw/2))),y=Math.round((H-chh)/2);
  const base=ex.id,assF=base+'.ass';fs.writeFileSync(path.join(wd,assF),makeAss(ws,c.style,tw,th));
  const sel=keeps?keeps.map(([a,b])=>`between(t,${a.toFixed(3)},${b.toFixed(3)})`).join('+'):null;
  let fc=`[0:v]${sel?`select='${sel}',setpts=N/FRAME_RATE/TB,`:''}crop=${cw}:${chh}:${x}:${y},scale=${tw}:${th}:flags=lanczos,setsar=1,ass=${assF}[v]`;
  if(p.hasAudio)fc+=`;[0:a]${sel?`aselect='${sel}',asetpts=N/SR/TB`:'anull'}[a]`;
  fs.writeFileSync(path.join(wd,base+'.txt'),fc);
  const out=path.join(D,'exports',base+'.mp4');
  await run(FF,['-y','-ss',String(c.start),'-t',String(dur),'-i',p.file,'-filter_complex_script',base+'.txt','-map','[v]',...(p.hasAudio?['-map','[a]']:[]),'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',out],{cwd:wd});
  ex.status='done';ex.size=fs.statSync(out).size;ex.file=base+'.mp4'}catch(e){ex.status='error';ex.error=e.message}save()}
// ---- server
if(process.env.TGR_TEST)module.exports={makeAss,doExport,pick,T,db};
const app=express();app.use(express.json({limit:'50mb'}));app.use(express.static(path.join(__dirname,'public')));app.use('/media',express.static(path.join(D,'uploads')));
const up=multer({storage:multer.diskStorage({destination:path.join(D,'uploads'),filename:(q,f,cb)=>cb(null,id()+path.extname(f.originalname).toLowerCase())})});
const ok=(c,a)=>run(c,a).then(()=>true,()=>false);
app.get('/api/health',async(q,r)=>r.json({ffmpeg:await ok(FF,['-version']),whisper:await ok(PY,['-c','import faster_whisper']),opencv:await ok(PY,['-c','import cv2']),model:MODEL}));
app.get('/api/templates',(q,r)=>r.json(T));
app.get('/api/projects',(q,r)=>r.json(db.projects.slice().reverse()));
app.post('/api/upload',up.single('video'),async(q,r)=>{try{if(!q.file)throw new Error('No file');const j=JSON.parse((await run(FP,['-v','error','-print_format','json','-show_streams','-show_format',q.file.path])).so),v=j.streams.find(s=>s.codec_type==='video');if(!v)throw new Error('Not a video file');
 const p={id:id(),name:q.file.originalname,file:q.file.path,url:'/media/'+q.file.filename,width:v.width,height:v.height,duration:+j.format.duration,hasAudio:j.streams.some(s=>s.codec_type==='audio'),created:Date.now(),status:'uploaded',clips:[],exports:[],words:[]};db.projects.push(p);save();r.json(p)}catch(e){r.status(400).json({error:e.message})}});
app.post('/api/projects/:id/analyze',(q,r)=>{const p=find(q.params.id);if(!p)return r.status(404).json({error:'Not found'});const L=+q.body.length||30,n=Math.min(20,+q.body.count||6);analyze(p,q.body.language||'en',L,n);r.json(p)});
app.put('/api/projects/:id/clips/:cid',(q,r)=>{const p=find(q.params.id),i=p&&p.clips.findIndex(c=>c.id===q.params.cid);if(!p||i<0)return r.status(404).json({error:'Not found'});p.clips[i]={...q.body,id:q.params.cid};save();r.json(p.clips[i])});
app.post('/api/projects/:id/clips/:cid/export',(q,r)=>{const p=find(q.params.id),c=p&&p.clips.find(c=>c.id===q.params.cid);if(!c)return r.status(404).json({error:'Not found'});if(!(c.end>c.start))return r.status(400).json({error:'Invalid trim'});const ex={id:id(),clip:c.title,ratio:c.ratio,status:'processing',created:Date.now()};p.exports.unshift(ex);save();doExport(p,c,ex);r.json(ex)});
app.get('/api/download/:file',(q,r)=>{const f=path.join(D,'exports',path.basename(q.params.file));fs.existsSync(f)?r.download(f):r.status(404).end()});
app.delete('/api/projects/:id',(q,r)=>{const p=find(q.params.id);if(p){fs.rmSync(p.file,{force:true});p.exports.forEach(e=>e.file&&fs.rmSync(path.join(D,'exports',e.file),{force:true}));db.projects=db.projects.filter(x=>x!==p);save()}r.json({ok:1})});
app.listen(process.env.PORT||3000,()=>console.log('TGR CLIPS AI on http://localhost:'+(process.env.PORT||3000)));
