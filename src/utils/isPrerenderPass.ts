/** Skip auth redirects while Playwright prerender runs (navigator.webdriver is true). */
export function isPrerenderPass(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    return navigator.webdriver === true;
}
