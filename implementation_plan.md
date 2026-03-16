# Crawling FirstChoice-Imaging

## Goal Description
Create a Node.js script to crawl `https://firstchoice-imaging.com` and all its internal links. The script will extract useful text data and save it as JSON files for AI training.

## Proposed Changes
### FirstChoice-Imaging
#### [NEW] [crawler.js](file:///c:/Users/video/OneDrive/Desktop/Brian%20Randall/AntigravityFiles/field-techs-pro/FirstChoice-Imaging/crawler.js)
- A script using `axios` and `cheerio` to fetch pages.
- A recursive crawler that follows internal links.
- Extracts text from `p`, `h1-h6`, `li`, `article` tags.
- Cleans whitespace.
- Saves each page as a JSON file in a `data` subdirectory.

#### [NEW] [package.json](file:///c:/Users/video/OneDrive/Desktop/Brian%20Randall/AntigravityFiles/field-techs-pro/FirstChoice-Imaging/package.json)
- Dependencies: `axios`, `cheerio`, `fs-extra` (for easier file ops).

## Verification Plan
### Automated Tests
- Run the crawler: `node crawler.js` inside the `FirstChoice-Imaging` directory.
- Verify `data` directory exists and contains JSON files.
- Check a sample JSON file for `url`, `title`, and `content` fields.

### Manual Verification
- I will inspect the output of the script in the terminal.
- I will read one of the generated JSON files to confirm data quality.
