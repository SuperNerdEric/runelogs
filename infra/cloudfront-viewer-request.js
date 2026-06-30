// CloudFront viewer-request function for S3-hosted prerendered SPA routes.
// Attach to the distribution behavior that serves the site origin.
//
// Without this rewrite, /about returns the root index.html fallback and crawlers
// never see build/about/index.html from the prerender step.
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
