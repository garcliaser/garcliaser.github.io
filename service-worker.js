const CACHE='treino3x-static-v15';
const CORE=['/','/manifest.webmanifest','/icon.svg','/extras/enhancements.css','/extras/enhancements.js','/app/part0.txt','/app/part1.txt','/app/part2.txt','/app/part3.txt','/app/part4.txt','/app/part5.txt','/app/part6.txt'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(u.hostname.includes('supabase.co'))return;
 if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('/',cp));return r}).catch(()=>caches.match('/')));return}
 if(e.request.method==='GET'&&u.origin===location.origin)e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(c=>c||fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(x=>x.put(e.request,cp));return r})));
});