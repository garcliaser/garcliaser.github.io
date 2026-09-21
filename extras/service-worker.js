const CACHE='treino3x-v10';
const CORE=['/','/manifest.webmanifest','/extras/enhancements.css','/extras/enhancements.js','/icon-192.png','/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(u.hostname.includes('supabase.co'))return;
 if(e.request.mode==='navigate'){
   e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('/',cp));return r}).catch(()=>caches.match('/')));
   return;
 }
 if(e.request.method==='GET'&&u.origin===location.origin)e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,cp));return r})));
});