// 缓存名称和版本
const CACHE_NAME = 'hengtai-vision-cache-v4';

// 需要缓存的资源列表 - 增加更多资源
const CACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './admin/index.html',
  './admin/admin.css',
  './admin/admin.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png'
];

// 安装Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker 安装中...');
  
  // 等待直到缓存完成
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存资源中...');
        // 尝试缓存所有资源，但忽略失败的请求
        return Promise.allSettled(
          CACHE_URLS.map(url => 
            cache.add(url).catch(error => {
              console.warn(`无法缓存资源: ${url}`, error);
              return Promise.resolve(); // 继续处理其他资源
            })
          )
        );
      })
      .then(() => {
        console.log('资源已缓存');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('预缓存失败:', error);
      })
  );
});

// 激活Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker 已激活');
  
  // 清除旧缓存
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('现在使用的是最新缓存');
      return self.clients.claim();
    })
  );
});

// 处理资源请求
self.addEventListener('fetch', event => {
  // 跳过不支持的请求（如摄像头流）
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
    return;
  }
  
  // 忽略非GET请求和非http(s)请求
  if (event.request.method !== 'GET' || 
      !event.request.url.startsWith('http')) {
    return;
  }
  
  // 对于模型文件使用缓存优先策略，避免重复下载大文件
  if (event.request.url.includes('@tensorflow') || 
      event.request.url.includes('coco-ssd')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(response => {
              // 确保响应有效
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // 克隆响应以便同时存入缓存和返回给浏览器
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                  console.log('已缓存模型文件:', event.request.url);
                });
              
              return response;
            });
        })
    );
    return;
  }
  
  // 对于API请求和摄像头流，使用网络优先策略
  if (event.request.url.includes('getUserMedia') || 
      event.request.url.includes('camera') || 
      event.request.headers.get('Accept')?.includes('image/')) {
    event.respondWith(
      fetch(event.request).catch(error => {
        console.error('网络请求失败:', error);
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // 对于JPEG图片，使用缓存优先并后台更新策略
  if (event.request.headers.get('Accept')?.includes('image/jpeg')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // 后台更新缓存
            fetch(event.request)
              .then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                  caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, networkResponse.clone()));
                }
              })
              .catch(() => {});
            return cachedResponse;
          }
          return fetch(event.request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, networkResponse.clone()));
              }
              return networkResponse;
            });
        })
    );
    return;
  }
  
  // 对于其他资源，使用缓存优先策略
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果找到缓存的响应，则返回缓存
        if (response) {
          // 对于HTML和CSS文件，如果网络可用，在后台更新缓存
          if (event.request.url.endsWith('.html') || 
              event.request.url.endsWith('.css') ||
              event.request.url.endsWith('.js')) {
            
            fetch(event.request)
              .then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                  const responseToCache = networkResponse.clone();
                  caches.open(CACHE_NAME)
                    .then(cache => {
                      cache.put(event.request, responseToCache);
                      console.log('后台更新缓存:', event.request.url);
                    });
                }
              })
              .catch(() => {
                // 忽略后台更新错误
              });
          }
          
          return response;
        }
        
        // 否则发起网络请求
        return fetch(event.request)
          .then(networkResponse => {
            // 如果获得了有效响应，将其缓存
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return networkResponse;
          })
          .catch(error => {
            console.error('网络请求和缓存都失败了:', error);
            
            // 如果是HTML请求，返回离线页面
            if (event.request.headers.get('Accept')?.includes('text/html')) {
              return caches.match('./index.html');
            }
            
            return new Response('网络连接不可用，请稍后再试。', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// 后台同步
self.addEventListener('sync', event => {
  if (event.tag === 'sync-settings') {
    event.waitUntil(syncSettings());
  }
});

// 同步设置的函数
async function syncSettings() {
  // 在这里实现设置同步逻辑
  console.log('同步设置...');
  
  // 从IndexedDB或其他存储中获取未同步的设置
  // 将设置同步到服务器
  // 更新本地存储状态
}

// 推送通知
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || '恒泰视觉 AI 识别系统';
  const options = {
    body: data.body || '有新的通知',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || './'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 点击通知
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});