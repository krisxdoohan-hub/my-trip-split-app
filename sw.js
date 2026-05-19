// ==========================================
// 旅遊分帳系統 Service Worker (支援離線與動態更新)
// ==========================================

// ✨ [系統版本識別] 每次更新主程式時，請同步更改此處版本號 ✨
const SW_VERSION = 'v0.0.0.3'; 
const CACHE_NAME = `trip-split-cache-${SW_VERSION}`;

// 需要快取的核心檔案清單
const urlsToCache = [
  './index.html',
  './manifest.json'
];

// 1. 安裝階段：將核心檔案存入手機快取
self.addEventListener('install', event => {
  console.log(`[Service Worker] 核心安裝中... 當前版本: ${SW_VERSION}`);
  // 強制立即接管控制權，不等待舊版 SW 關閉
  self.skipWaiting(); 
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. 活化階段：清理舊版本快取
self.addEventListener('activate', event => {
  console.log(`[Service Worker] 系統活化中... 準備清除舊版快取`);
  // 立即接管所有開啟的網頁客戶端
  event.waitUntil(clients.claim()); 
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 若比對到不是當前 v0.0.0.0 的快取名稱，就全數刪除
          if (cacheName !== CACHE_NAME) {
            console.log(`[Service Worker] 已自動刪除過期快取: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. 攔截請求：網路優先策略 (Network First)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).then(networkResponse => {
      // 若網路連線正常，抓取最新檔案並更新到快取中
      return caches.open(CACHE_NAME).then(cache => {
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      });
    }).catch(() => {
      // 若處於無網路/飛航模式，降級讀取本地快取，維持系統離線操作能力
      return caches.match(event.request);
    })
  );
});
