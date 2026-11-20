const V='lulu-v10';
self.addEventListener('install',e=>{ e.waitUntil(caches.open(V).then(c=>c.addAll(['./','./index.html','./manifest.webmanifest','./icon-192.png']).catch(()=>{})).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!=='lulu-tiles').map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(/(arcgisonline\.com|tile\.openstreetmap\.(org|de))$/.test(u.hostname)){ e.respondWith(tileFetch(r)); return; }
  if(u.origin!==location.origin&&u.hostname!=='unpkg.com') return;
  if(u.pathname.endsWith('version.json')) return;
  if(/\.mp3$/.test(u.pathname)) return;   // 音樂交給瀏覽器自己處理（Safari 需要 Range 請求）   // 地圖圖磚、景點查詢一律走網路
  const isPage=r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('.html')||u.pathname.endsWith('sw.js');
  e.respondWith(caches.open(V).then(async c=>{
    const hit=await c.match(r);
    const net=fetch(r,isPage?{cache:'no-cache'}:undefined).then(res=>{ if(res&&(res.ok||res.type==='opaque')) c.put(r,res.clone()); return res; });
    if(isPage) return net.catch(()=>hit);          // 頁面：先走網路（拿最新版），沒網路才用快取
    return hit||net.catch(()=>hit);                // 圖片、函式庫：快取優先
  }));
});

let tilePuts=0;
async function tileFetch(r){
  const c=await caches.open('lulu-tiles'); const hit=await c.match(r.url); if(hit) return hit;
  try{
    const res=await fetch(r.url,{mode:'cors'});
    if(res.ok){ c.put(r.url,res.clone()); if(++tilePuts%40===0) trimTiles(c); }
    return res;
  }catch(_){ try{ return await fetch(r); }catch(e){ return Response.error(); } }
}
async function trimTiles(c){ const ks=await c.keys(); if(ks.length>1500) for(const k of ks.slice(0,ks.length-1200)) await c.delete(k); }
