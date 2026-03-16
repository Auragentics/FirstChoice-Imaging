const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const URL = require('url').URL;

const START_URL = 'https://firstchoice-imaging.com';
const DATA_DIR = path.join(__dirname, 'data');
const MAX_CONCURRENCY = 1; // Be polite

const visited = new Set();
const queue = [START_URL];
let processing = 0;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizeFilename(url) {
    let name = url.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    if (name.length > 100) name = name.substring(0, 100);
    return name + '.json';
}

async function crawl() {
    await fs.ensureDir(DATA_DIR);

    while (queue.length > 0 || processing > 0) {
        if (queue.length > 0 && processing < MAX_CONCURRENCY) {
            const currentUrl = queue.shift();

            if (visited.has(currentUrl)) continue;
            visited.add(currentUrl);

            processing++;
            processUrl(currentUrl).finally(() => {
                processing--;
            });
        } else {
            await sleep(100);
        }
    }
    console.log('Crawling finished.');
}

async function processUrl(url) {
    console.log(`Fetching: ${url}`);
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Extract useful data
        const title = $('title').text().trim();
        const bodyContent = [];

        // Select potentially useful elements
        $('p, h1, h2, h3, h4, h5, h6, li, article, .content, #content').each((i, el) => {
            // Remove scripts and styles within these elements just in case
            $(el).find('script, style').remove();
            const text = $(el).text().trim().replace(/\s+/g, ' ');
            if (text.length > 20) { // Filter out very short snippets
                bodyContent.push(text);
            }
        });

        // Filter duplicates and empty strings
        const cleanContent = [...new Set(bodyContent)];

        const data = {
            url: url,
            title: title,
            content: cleanContent,
            timestamp: new Date().toISOString()
        };

        const filename = sanitizeFilename(url);
        await fs.writeJson(path.join(DATA_DIR, filename), data, { spaces: 2 });

        // Find internal links
        $('a[href]').each((i, el) => {
            const href = $(el).attr('href');
            try {
                const absoluteUrl = new URL(href, url).href;

                // Only crawl same domain
                if (absoluteUrl.startsWith(START_URL) && !absoluteUrl.includes('#')) {
                    // Filter out non-html resources
                    if (!absoluteUrl.match(/\.(jpg|jpeg|png|gif|pdf|zip|css|js)$/i)) {
                        if (!visited.has(absoluteUrl) && !queue.includes(absoluteUrl)) {
                            queue.push(absoluteUrl);
                        }
                    }
                }
            } catch (e) {
                // Invalid URL, ignore
            }
        });

    } catch (error) {
        console.error(`Failed to fetch ${url}: ${error.message}`);
    }
}

crawl().catch(console.error);
