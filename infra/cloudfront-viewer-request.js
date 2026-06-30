// CloudFront viewer-request function for S3-hosted prerendered SPA routes.
// Attach ONLY if you serve bot-only snapshots from build/_prerender/ to crawlers.
// Do NOT serve prerender HTML to normal browsers — it flashes before React loads.
//
// Typical setup: detect crawler User-Agent, rewrite request to /_prerender{uri}/index.html
// for bots only; everyone else gets the normal SPA shell (index.html fallback).
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    if (!uri.includes('.')) {
        if (uri.endsWith('/')) {
            request.uri += 'index.html';
        } else {
            request.uri += '/index.html';
        }
    }

    return request;
}
