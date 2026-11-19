const V='lulu-v1';
self.addEventListener('install',e=>{ e.waitUntil(caches.open(V).then(c=>c.addAll(['./','./index.html','./manifest.webmanifest','./icon-192.png']).catch(()=>{})).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.origin!==location.origin&&u.hostname!=='unpkg.com') return;   // 地圖圖磚、景點查詢一律走網路
  e.respondWith(caches.open(V).then(async c=>{
    const hit=await c.match(r);
    const net=fetch(r).then(res=>{ if(res&&(res.ok||res.type==='opaque')) c.put(r,res.clone()); return res; }).catch(()=>hit);
    return hit||net;
  }));
});
