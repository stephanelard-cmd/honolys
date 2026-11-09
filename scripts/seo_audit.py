#!/usr/bin/env python3
"""Audit SEO statique, sans accès réseau ni modification de contenu."""
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import json
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://honolys.fr"
NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
errors = []


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.h1 = 0
        self.in_title = False
        self.title = ""
        self.description = None
        self.robots = ""
        self.canonicals = []
        self.scripts = []
        self.in_json = False
        self.json_buffer = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "h1":
            self.h1 += 1
        if tag == "title":
            self.in_title = True
        if tag == "meta" and attrs.get("name", "").lower() == "description":
            self.description = attrs.get("content")
        if tag == "meta" and attrs.get("name", "").lower() == "robots":
            self.robots = attrs.get("content", "")
        if tag == "link" and "canonical" in attrs.get("rel", "").split():
            self.canonicals.append(attrs.get("href"))
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.in_json = True
            self.json_buffer = []

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.in_json:
            self.json_buffer.append(data)

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "script" and self.in_json:
            self.in_json = False
            self.scripts.append("".join(self.json_buffer))
            self.json_buffer = []


def audit():
    robots = ROOT / "robots.txt"
    sitemap = ROOT / "sitemap.xml"
    if not robots.is_file() or not sitemap.is_file():
        errors.append("robots.txt ou sitemap.xml absent")
        return

    if f"Sitemap: {ORIGIN}/sitemap.xml" not in robots.read_text(encoding="utf-8"):
        errors.append("robots.txt ne référence pas le sitemap canonique")

    try:
        root = ET.parse(sitemap).getroot()
    except ET.ParseError as exc:
        errors.append(f"XML du sitemap invalide : {exc}")
        return

    urls = []
    for node in root.findall("s:url", NS):
        location = node.findtext("s:loc", namespaces=NS)
        if not location:
            errors.append("Entrée du sitemap sans loc")
            continue
        urls.append(location)

        parts = urlparse(location)
        if parts.scheme != "https" or parts.netloc != "honolys.fr" or parts.query or parts.fragment:
            errors.append(f"URL de sitemap non canonique : {location}")
            continue

        lastmod = node.findtext("s:lastmod", namespaces=NS)
        if lastmod:
            try:
                if date.fromisoformat(lastmod) > date.today():
                    errors.append(f"lastmod futur : {location} ({lastmod})")
            except ValueError:
                errors.append(f"lastmod invalide : {location} ({lastmod})")

        relpath = parts.path.lstrip("/") or "index.html"
        if parts.path.endswith("/") and relpath != "index.html":
            relpath += "index.html"
        pagefile = ROOT / relpath
        if not pagefile.is_file():
            errors.append(f"Page du sitemap absente : {relpath}")
            continue

        page = Page()
        page.feed(pagefile.read_text(encoding="utf-8"))
        if not page.title.strip():
            errors.append(f"Titre absent : {relpath}")
        if not page.description or not 30 <= len(page.description) <= 180:
            errors.append(f"Description manquante ou hors plage : {relpath}")
        if page.h1 != 1:
            errors.append(f"Nombre de H1 incorrect ({page.h1}) : {relpath}")
        if page.canonicals != [location]:
            errors.append(f"Canonique incorrecte : {relpath} -> {page.canonicals}")
        if "noindex" in page.robots.lower():
            errors.append(f"Page du sitemap marquée noindex : {relpath}")

        for raw in page.scripts:
            try:
                json.loads(raw)
            except json.JSONDecodeError as exc:
                errors.append(f"JSON-LD invalide dans {relpath} : {exc}")

        if relpath == "faq.html" and not any('"FAQPage"' in raw for raw in page.scripts):
            errors.append("Balisage FAQPage absent de faq.html")

    if len(urls) != len(set(urls)):
        errors.append("URL dupliquée dans sitemap.xml")
    if f"{ORIGIN}/" not in urls:
        errors.append("Accueil absent du sitemap")
    if f"{ORIGIN}/faq.html" not in urls:
        errors.append("FAQ absente du sitemap")

    print(f"SEO statique : {len(urls)} URL contrôlées ; {len(errors)} erreur(s)")
    for error in errors:
        print("ERREUR :", error)


if __name__ == "__main__":
    audit()
    sys.exit(1 if errors else 0)
