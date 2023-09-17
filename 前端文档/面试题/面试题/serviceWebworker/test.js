self.addEventListener('install', (event) => {
    console.log("install")
    event.waitUntil(
        caches.open("example-cache").then(function (cache) {
            return cache.addAll([
                "./00020-1409380547.jpeg"
            ]);
        })
    );
})
self.addEventListener("fetch", function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});
self.addEventListener("activate", function (event) {
    console.log("activate")
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheName !== "example-cache") {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

