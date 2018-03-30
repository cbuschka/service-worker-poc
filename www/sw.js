const assets = ['index.html', 'index.js'];
const global = this;
const WORKER_NAME = 'sw-46';
const CACHE_NAME = WORKER_NAME + '-' + new Date().toISOString();

function getAssetsToCache() {
  const assetsToCache = [...assets, './'];
  return assetsToCache.map(path => {
    return new URL(path, global.location).toString();
  });
}

self.addEventListener('install', (event) => {
  console.info(WORKER_NAME + ': Install event received.');

  const assetsToCache = getAssetsToCache();

  event.waitUntil(
    global.caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(assetsToCache);
      })
      .then(() => {
        console.info('Cached assets: ', assetsToCache);
      })
      .catch(error => {
        console.error(WORKER_NAME + ': Error happened:', error);
        throw error;
      })
  );
});


self.addEventListener('message', (event) => {
  console.info(WORKER_NAME + ': Got message %o', event);
  switch(event.data.action) {
    case 'reload':
      console.info(WORKER_NAME + ": skip waiting");
      self.skipWaiting();
      console.info(WORKER_NAME + ": claiming clients");
      self.clients.claim();
      break;
   }
});

self.addEventListener('activate', (event) => {
  console.info(WORKER_NAME + ': Activate event received.');

  event.waitUntil(
    global.caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName === CACHE_NAME) {
            return null;
          }

          console.info(`${WORKER_NAME} Deleting cache ${cacheName}...`);
          return global.caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET' ) {
    console.info(`${WORKER_NAME} Ignored a non GET request ${request.method}.`);
    return;
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== location.origin) {
    console.info(`${WORKER_NAME} Ignored a different origin ${requestUrl.origin}.`);
    return;
  }

  const resource = global.caches.match(request).then(response => {
    if (response) {
      console.info(`${WORKER_NAME} Returning ${requestUrl.href} from cache.`);

      return response;
    }

    // Load and cache known assets.
    return fetch(request)
      .then(responseNetwork => {
        if (!responseNetwork || !responseNetwork.ok) {
          console.info(`${WORKER_NAME} [${requestUrl.toString()}] wrong responseNetwork: ${responseNetwork.status} ${responseNetwork.type}`);

          return responseNetwork;
        }

        console.info(`${WORKER_NAME} URL ${requestUrl.href} fetched`);

        const responseCache = responseNetwork.clone();
        global.caches
          .open(CACHE_NAME)
          .then(cache => {
            return cache.put(request, responseCache);
          })
          .then(() => {
            console.info(`${WORKER_NAME} Cached asset: ${requestUrl.href}.`);
          });

        return responseNetwork;
      })
      .catch(() => {
        if (event.request.mode === 'navigate') {
          return global.caches.match('./');
        }

        return null;
      });
  });

  event.respondWith(resource);
});
