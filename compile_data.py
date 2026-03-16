import json
import glob
import os
import sys
import traceback
from datetime import datetime

LOG_FILE = "compile_log.txt"

def log(message):
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            f.write(f"[{timestamp}] {message}\n")
    except Exception:
        pass # If we can't write to log, we can't do much

def compile_data():
    # clear log
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("Starting compilation...\n")
        
    try:
        log(f"Current working directory: {os.getcwd()}")
        
        output_file = "FirstChoice_Data_Compiled.html"
        data_dir = "data"
        
        abs_data_dir = os.path.join(os.getcwd(), data_dir)
        log(f"Looking for JSON files in: {abs_data_dir}")

        if not os.path.exists(abs_data_dir):
            log(f"ERROR: Data directory does not exist: {abs_data_dir}")
            return

        html_content = [
            "<!DOCTYPE html>",
            "<html lang='en'>",
            "<head>",
            "<meta charset='UTF-8'>",
            "<meta name='viewport' content='width=device-width, initial-scale=1.0'>",
            "<title>First Choice Imaging - Deep Crawl Data</title>",
            "<style>",
            "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }",
            ".page-entry { border: 1px solid #ddd; border-radius: 8px; margin-bottom: 30px; padding: 20px; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }",
            ".meta { background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 0.9em; margin-bottom: 15px; border-left: 4px solid #0056b3; }",
            ".content { white-space: pre-wrap; font-family: 'Consolas', 'Monaco', monospace; background: #f9f9f9; padding: 15px; border-radius: 4px; overflow-x: auto; }",
            "h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }",
            "h2 { color: #0056b3; margin-top: 0; }",
            ".toc { background: #eef2f7; padding: 20px; border-radius: 8px; margin-bottom: 30px; }",
            ".toc ul { list-style-type: none; padding: 0; }",
            ".toc li { margin-bottom: 5px; }",
            ".toc a { text-decoration: none; color: #0056b3; }",
            ".toc a:hover { text-decoration: underline; }",
            "</style>",
            "</head>",
            "<body>",
            f"<h1>First Choice Imaging - Website Content Dump</h1>",
            f"<p><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>",
            "<div class='toc'><h2>Table of Contents</h2><ul>"
        ]

        # Get all JSON files
        search_path = os.path.join(data_dir, "*.json")
        json_files = sorted(glob.glob(search_path))
        log(f"Found {len(json_files)} JSON files.")
        
        entries = []

        # Read all files
        for file_path in json_files:
            try:
                log(f"Reading {file_path}...")
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    entries.append(data)
            except Exception as e:
                log(f"Error reading {file_path}: {e}")

        # Build TOC
        for i, entry in enumerate(entries):
            title = entry.get('title', 'Unknown Page')
            entry_id = f"page-{i}"
            html_content.append(f"<li><a href='#{entry_id}'>{title}</a></li>")
        
        html_content.append("</ul></div>")

        # Build Entries
        for i, entry in enumerate(entries):
            title = entry.get('title', 'Unknown Page')
            url = entry.get('url', 'N/A')
            content = entry.get('content', '')
            timestamp = entry.get('timestamp', '')
            entry_id = f"page-{i}"

            html_content.append(f"<div class='page-entry' id='{entry_id}'>")
            html_content.append(f"<h2>{title}</h2>")
            html_content.append("<div class='meta'>")
            html_content.append(f"<strong>URL:</strong> <a href='{url}' target='_blank'>{url}</a><br>")
            html_content.append(f"<strong>Crawled:</strong> {timestamp}")
            html_content.append("</div>")
            html_content.append("<div class='content'>")
            html_content.append(content) # Raw content is pre-wrapped
            html_content.append("</div>")
            html_content.append("</div>")

        html_content.append("</body></html>")

        # Write output
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write("\n".join(html_content))
            log(f"Successfully compiled {len(entries)} pages to {output_file}")
        except Exception as e:
            log(f"Error writing to output file: {e}")
            
    except Exception as e:
        log(f"CRITICAL ERROR: {e}")
        log(traceback.format_exc())

if __name__ == "__main__":
    compile_data()
