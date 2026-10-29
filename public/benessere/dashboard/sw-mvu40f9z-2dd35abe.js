/* Benessere: only versioned app shell; no API responses, credentials or diary data. */
const CACHE="benessere-shell-v1-mvu40f9z-2dd35abe";
const BASE="/Brain-Training-Suite/benessere";
const ASSETS=["/Brain-Training-Suite/benessere/_next/static/chunks/12.f1f4d35b52633e8d.js","/Brain-Training-Suite/benessere/_next/static/chunks/131-be423b4770f3dcbb.js","/Brain-Training-Suite/benessere/_next/static/chunks/489.158bbe303a595fba.js","/Brain-Training-Suite/benessere/_next/static/chunks/661-bdd6c4034e0d1db8.js","/Brain-Training-Suite/benessere/_next/static/chunks/app/dashboard/page-cd8318d5ec10c763.js","/Brain-Training-Suite/benessere/_next/static/chunks/app/layout-d6a4acdc3b0146a1.js","/Brain-Training-Suite/benessere/_next/static/chunks/app/page-49b63eda5496c26c.js","/Brain-Training-Suite/benessere/_next/static/chunks/app/robots.txt/route-edc038b33a4f226e.js","/Brain-Training-Suite/benessere/_next/static/chunks/app/_not-found/page-74040a1347b8d95f.js","/Brain-Training-Suite/benessere/_next/static/chunks/c7879cf7-b5ab1053c1d9a2e7.js","/Brain-Training-Suite/benessere/_next/static/chunks/framework-37eb0f75d9375c3b.js","/Brain-Training-Suite/benessere/_next/static/chunks/main-2b3355c8ce6857b3.js","/Brain-Training-Suite/benessere/_next/static/chunks/main-app-39f4b5e32df235cb.js","/Brain-Training-Suite/benessere/_next/static/chunks/pages/_app-32d20d5a04949d29.js","/Brain-Training-Suite/benessere/_next/static/chunks/pages/_error-abbab53f25ea29b0.js","/Brain-Training-Suite/benessere/_next/static/chunks/polyfills-42372ed130431b0a.js","/Brain-Training-Suite/benessere/_next/static/chunks/webpack-f4675034a824a084.js","/Brain-Training-Suite/benessere/_next/static/css/446aefb8b8ad620c.css","/Brain-Training-Suite/benessere/_next/static/Zg2Cbu0q0mvCQo6UoiFbM/_buildManifest.js","/Brain-Training-Suite/benessere/_next/static/Zg2Cbu0q0mvCQo6UoiFbM/_ssgManifest.js","/Brain-Training-Suite/benessere/dashboard/index.html","/Brain-Training-Suite/benessere/dashboard/index.txt","/Brain-Training-Suite/benessere/dashboard/manifest-mvu40f9z-2dd35abe.webmanifest","/Brain-Training-Suite/benessere/dashboard/icon-mvu40f9z-2dd35abe-192.png","/Brain-Training-Suite/benessere/dashboard/icon-mvu40f9z-2dd35abe-512.png"];
const ALLOWED=new Set(ASSETS);
const SHELL=BASE+'/dashboard/index.html';
const gatewayHeaders=request=>{const headers=new Headers(request?.headers);headers.set('ngrok-skip-browser-warning','1');return headers;};
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 try{for(const path of ASSETS){const r=await fetch(new Request(path,{credentials:'same-origin',cache:'reload',headers:gatewayHeaders()}));if(!r.ok||r.redirected)throw Error('Offline shell unavailable');await cache.put(path,r);}}
 catch(e){await caches.delete(CACHE);throw e;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const names=(await caches.keys()).filter(k=>k.startsWith('benessere-shell-v1-'));
 for(const name of names.filter(k=>k!==CACHE).slice(0,-1))await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')event.waitUntil(self.skipWaiting());});
self.addEventListener('fetch',event=>{
 const r=event.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith(BASE+'/api/'))return;
 if(r.mode==='navigate'&&[BASE+'/dashboard/',BASE+'/dashboard/index.html',BASE+'/dashboard'].includes(u.pathname)){
  event.respondWith((async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);try{const response=await fetch(r,{signal:controller.signal,headers:gatewayHeaders(r),redirect:'follow'});if(response.redirected&&response.status===200&&response.url&&new URL(response.url).origin===self.location.origin&&new URL(response.url).pathname===BASE+'/'){const shell=await(await caches.open(CACHE)).match(SHELL);if(shell)return shell;}if(response.status<500)return response;throw Error('Gateway unavailable');}catch{const shell=await(await caches.open(CACHE)).match(SHELL);return shell||new Response('Apri l’app online per preparare la copia offline.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}finally{clearTimeout(timer);}})());return;
 }
 if(ALLOWED.has(u.pathname))event.respondWith((async()=>{const cache=await caches.open(CACHE),saved=await cache.match(u.pathname);return saved||fetch(r,{headers:gatewayHeaders(r)});})());
});
