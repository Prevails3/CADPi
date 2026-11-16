"""
update_all_internal_links.py
Updates internal links across core pages (index.html, locations.html, blog.html, services/*.html)
to point directly to the new hierarchical programmatic silos, updates global footers,
updates robots.txt, and adds 301 redirect logic to worker.js.
"""

import json
import os
import re

with open("data/locations.json") as f:
    data = json.load(f)

legacy_map = {
    "arizona-private-investigator.html": "/locations/arizona/",
    "california-private-investigator.html": "/locations/california/",
    "florida-private-investigator.html": "/locations/florida/",
    "texas-private-investigator.html": "/locations/texas/",
    "new-york-private-investigator.html": "/locations/new-york/",
    "locations.html": "/locations/",
}

for s in data["states"]:
    legacy_map[f"{s['state_slug']}-private-investigator.html"] = f"/locations/{s['state_slug']}/"
    for c in s["cities"]:
        legacy_map[f"{c['city_slug']}-private-investigator.html"] = f"/locations/{s['state_slug']}/{c['city_slug']}/"

legacy_map["westchester-county-private-investigator.html"] = "/locations/new-york/westchester-county/"
legacy_map["hudson-valley-private-investigator.html"] = "/locations/new-york/hudson-valley/"
legacy_map["new-york-city-private-investigator.html"] = "/locations/new-york/new-york-city/"

# 1. Update links in index.html, blog.html, services/*.html, privacy-policy.html
files_to_update = ["index.html", "blog.html", "locations.html", "privacy-policy.html"]
if os.path.exists("services"):
    for sf in os.listdir("services"):
        if sf.endswith(".html"):
            files_to_update.append(os.path.join("services", sf))

print(f"Updating internal links in {len(files_to_update)} files...")
updated_count = 0
for fpath in files_to_update:
    if not os.path.exists(fpath):
        continue
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content
    # Replace relative patterns
    for old_file, new_url in legacy_map.items():
        # Match href="locations/old_file" or href="../locations/old_file" or href="/locations/old_file"
        new_content = re.sub(
            r'href=["\'](?:\.\./|\/)?locations/' + re.escape(old_file) + r'(#[a-zA-Z0-9_-]+)?["\']',
            lambda m: f'href="{new_url}{m.group(1) or ""}"',
            new_content
        )
        if old_file == "locations.html":
            new_content = re.sub(r'href=["\'](?:\.\./|\/)?locations\.html["\']', 'href="/locations/"', new_content)

    if new_content != content:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(new_content)
        updated_count += 1
        print(f"  [+] Updated links in {fpath}")

# 2. Update footer in index.html, blog.html, services/*.html to include direct state hub links
footer_locations_block = """        <div class="footer-links-col">
          <h3 class="footer-title">Practice Locations</h3>
          <ul class="footer-links">
            <li><a href="/locations/">Nationwide Directory (55 Metros)</a></li>
            <li><a href="/locations/arizona/">Arizona State Hub (HQ)</a></li>
            <li><a href="/locations/california/">California State Hub</a></li>
            <li><a href="/locations/florida/">Florida State Hub</a></li>
            <li><a href="/locations/texas/">Texas State Hub</a></li>
            <li><a href="/locations/new-york/">New York State Hub</a></li>
          </ul>
        </div>"""

for fpath in files_to_update:
    if not os.path.exists(fpath) or fpath == "locations.html":
        continue
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Check if there is an existing locations footer col
    m = re.search(r'<div class="footer-links-col">\s*<h3 class="footer-title">(?:Locations &amp; Reach|Practice Locations|Service Locations)</h3>[\s\S]*?</div>', content)
    if m:
        content = content[:m.start()] + footer_locations_block + content[m.end():]
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  [+] Updated footer locations in {fpath}")

# 3. Update robots.txt
with open("robots.txt", "w", encoding="utf-8") as f:
    f.write("""User-agent: *
Allow: /

Sitemap: https://cadprivateinvestigations.com/sitemap_index.xml
Sitemap: https://cadprivateinvestigations.com/sitemap.xml
""")
print("  [+] Updated robots.txt")

# 4. Update worker.js with 301 redirects
with open("worker.js", "r", encoding="utf-8") as f:
    worker_js = f.read()

# Build redirection map JSON string
redirect_dict = {}
for old_file, new_url in legacy_map.items():
    if old_file != "locations.html":
        redirect_dict[f"/locations/{old_file}"] = new_url
redirect_dict["/locations.html"] = "/locations/"

redirect_json_str = json.dumps(redirect_dict, indent=6)

worker_redirect_snippet = f"""      // --- SEO 301 REDIRECTS FOR LEGACY LOCATION PATHS & CLEAN SLASHES ---
      const LEGACY_LOCATION_REDIRECTS = {redirect_json_str};

      if (LEGACY_LOCATION_REDIRECTS[url.pathname]) {{
        return Response.redirect(new URL(LEGACY_LOCATION_REDIRECTS[url.pathname], request.url).toString(), 301);
      }}

      if (url.pathname.startsWith('/locations') && !url.pathname.endsWith('/') && !url.pathname.includes('.')) {{
        return Response.redirect(new URL(url.pathname + '/', request.url).toString(), 301);
      }}
"""

if "// --- SEO 301 REDIRECTS FOR LEGACY LOCATION PATHS & CLEAN SLASHES ---" not in worker_js:
    target = "    // --- STATIC ASSET SERVING & CLEAN URL ROUTING ---\n    if (env.ASSETS) {"
    if target in worker_js:
        worker_js = worker_js.replace(target, target + "\n" + worker_redirect_snippet)
        with open("worker.js", "w", encoding="utf-8") as f:
            f.write(worker_js)
        print("  [+] Injected 301 redirect table into worker.js")
    else:
        print("  [!] Could not locate target in worker.js")
else:
    print("  [i] worker.js already contains redirect logic")

print("\nAll internal links and redirects updated successfully.")
