"""Check a production Hugo build using Python's standard library.

Run after `hugo --gc --minify`: python3 scripts/check_site.py
"""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1] / "public"
BASE = "https://secentral.github.io"


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
        self.ids = set()
        self.links = []
        self.canonicals = []
        self.h1 = 0
        self.main = 0
        self.description = False
        self.feed_link = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            assert attrs["id"] not in self.ids, f"Duplicate ID: {self.path}: {attrs['id']}"
            self.ids.add(attrs["id"])
        self.h1 += tag == "h1"
        self.main += tag == "main"
        if tag == "meta" and attrs.get("name") == "description":
            self.description = bool(attrs.get("content"))
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonicals.append(attrs["href"])
        if tag == "link" and attrs.get("type") == "application/rss+xml":
            self.feed_link = True
        if tag == "img":
            assert attrs.get("alt") is not None, f"Missing image alternative: {self.path}"
            assert attrs.get("width") and attrs.get("height"), f"Missing image dimensions: {self.path}"
        if tag in {"a", "link", "img", "script"}:
            url = attrs.get("href", attrs.get("src"))
            if url:
                self.links.append(url)


def check():
    assert ROOT.is_dir(), "Run Hugo before checking the generated site"
    pages = {}
    for path in ROOT.rglob("*.html"):
        page = Page(path)
        page.feed(path.read_text())
        assert page.h1 == 1 and page.main == 1, f"Expected one h1 and main: {path}"
        assert page.description and page.feed_link, f"Missing description or feed discovery: {path}"
        if path.name != "404.html":
            assert len(page.canonicals) == 1 and page.canonicals[0].startswith(BASE + "/"), f"Invalid canonical: {path}"
        pages[path.resolve()] = page

    for path, page in pages.items():
        for link in page.links:
            url = urlsplit(link)
            if url.scheme or url.netloc:
                if url.scheme not in {"http", "https"} or url.netloc != urlsplit(BASE).netloc:
                    continue
            target = ROOT / unquote(url.path).lstrip("/") if url.path.startswith("/") else path.parent / unquote(url.path)
            if not url.path:
                target = path
            if target.is_dir():
                target /= "index.html"
            assert target.is_file(), f"Broken local link in {path}: {link}"
            if url.fragment and target.resolve() in pages:
                assert unquote(url.fragment) in pages[target.resolve()].ids, f"Missing anchor in {path}: {link}"

    feed = ET.parse(ROOT / "blog/index.xml").getroot()
    items = feed.findall("channel/item")
    assert items, "Blog RSS has no posts"
    for item in items:
        assert item.findtext("link", "").startswith(BASE + "/blog/"), "Unexpected RSS entry"
        assert item.findtext("pubDate"), "RSS item has no publication date"
    sitemap = ET.parse(ROOT / "sitemap.xml")
    locations = [node.text for node in sitemap.findall("{*}url/{*}loc")]
    assert BASE + "/" in locations and BASE + "/blog/" in locations, "Missing sitemap entries"
    assert all(url.startswith(BASE + "/") for url in locations), "Non-production sitemap URLs"
    assert "Sitemap: " + BASE + "/sitemap.xml" in (ROOT / "robots.txt").read_text(), "Missing sitemap discovery"
    assert (ROOT / "images/social-preview.png").is_file(), "Missing social-preview image"
    assert (ROOT / "fonts/marcellus-latin.woff2").is_file(), "Missing heading font"
    for asset in ["favicon.svg", "favicon-32.png", "favicon.ico", "apple-touch-icon.png"]:
        assert (ROOT / asset).is_file(), f"Missing site asset: {asset}"
    favicon = ET.parse(ROOT / "favicon.svg").getroot()
    assert favicon.find("{*}title") is not None and favicon.find("{*}path").get("fill") == "none", "Favicon must use the outlined light-surface shield"
    home = (ROOT / "index.html").read_text()
    for value in ["db01", "Red Hat", "web02", "Fedora", "app03", "SUSE", "Heartbeat", "AVC", "Policy change"]:
        assert value in home, f"Missing fleet diagram content: {value}"
    assert "Linux host" not in home and "Pause animation" not in home and "Explore the agent" not in home
    assert "class=screenshot-dialog" in home
    assert "method=dialog" in home and 'aria-label="Previous screenshot"' in home
    assert 'aria-label="Next screenshot"' in home and "aria-live=polite" in home
    for name in ["secentral-logo", "secentral-mark"]:
        logo = ET.parse(ROOT / "images" / f"{name}.svg").getroot()
        assert logo.find("{*}title") is not None and logo.find("{*}text") is None, "Logo must have a title and outlined lettering"
        assert not logo.findall("{*}circle"), "Logo must use the dot-free shield"
    print(f"Passed: {len(pages)} HTML pages, local links and anchors, RSS ({len(items)} posts), sitemap, and launch assets.")


if __name__ == "__main__":
    check()
