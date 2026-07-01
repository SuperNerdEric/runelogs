import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const blogPostsPath = join(__dirname, '..', 'src', 'data', 'blogPosts.ts');
const sitemapPath = join(__dirname, '..', 'public', 'sitemap.xml');
const SITE_URL = 'https://www.runelogs.com';

export function generateBlogSlug(title) {
    let slug = title
        .toLowerCase()
        .replace(/[\u2014\u2013]/g, '-')
        .replace(/[^a-z0-9\s.-]/g, '')
        .trim();

    slug = slug.replace(/(\d)\.(\d)/g, '$1-$2').replace(/\./g, '-');
    return slug.replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function parseBlogPosts() {
    const content = readFileSync(blogPostsPath, 'utf8');
    const posts = [];
    const entryPattern = /date: '([^']+)',\s*\n\s*title: '([^']+)'/g;

    for (const match of content.matchAll(entryPattern)) {
        posts.push({
            date: match[1],
            title: match[2],
            slug: generateBlogSlug(match[2]),
        });
    }

    return posts.sort((a, b) => b.date.localeCompare(a.date) || b.title.localeCompare(a.title));
}

function buildBlogSitemapXml(posts) {
    return posts
        .map(
            (post) => `    <url>
        <loc>${SITE_URL}/blog/${post.slug}</loc>
        <lastmod>${post.date}</lastmod>
    </url>`,
        )
        .join('\n');
}

function updateSitemap(posts) {
    const blogXml = buildBlogSitemapXml(posts);
    let sitemap = readFileSync(sitemapPath, 'utf8');

    const blogIndexPattern = /    <url>\s*\n\s*<loc>https:\/\/www\.runelogs\.com\/blog<\/loc>\s*\n\s*<\/url>/;
    if (!blogIndexPattern.test(sitemap)) {
        throw new Error('Blog index entry not found in sitemap.xml');
    }

    sitemap = sitemap.replace(
        blogIndexPattern,
        `    <url>
        <loc>${SITE_URL}/blog</loc>
    </url>
${blogXml}`,
    );

    writeFileSync(sitemapPath, sitemap, 'utf8');
}

const posts = parseBlogPosts();
const dupes = posts.map((p) => p.slug).filter((slug, i, all) => all.indexOf(slug) !== i);
if (dupes.length > 0) {
    throw new Error(`Duplicate slugs: ${[...new Set(dupes)].join(', ')}`);
}

updateSitemap(posts);
console.log(`Updated sitemap with ${posts.length} blog post URLs.`);
