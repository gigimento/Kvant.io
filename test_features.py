"""Diagnose analytics hub issue - why does it show 'no connected sources'?"""

import os, sys, time, tempfile, json

sys.stdout.reconfigure(encoding="utf-8")

from playwright.sync_api import sync_playwright
import requests, urllib3

urllib3.disable_warnings()

BASE = "https://kvantio.vercel.app"
OUT = tempfile.gettempdir()
PASSWORD = os.environ.get("TEST_PASSWORD", "")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    # Login
    print("Logging in...")
    page.goto(f"{BASE}/login", wait_until="networkidle")
    page.fill("#email", "igor.ilic@outlook.com")
    page.fill("#password", PASSWORD)
    page.click("button[type='submit']")
    time.sleep(4)
    page.wait_for_load_state("networkidle")
    print(f"URL after login: {page.url}")

    if "/login" in page.url:
        # Check error
        err = page.locator("p.text-red-400").first
        print(f"Login failed: {err.text_content() if err.count() > 0 else 'unknown'}")
        browser.close()
        exit(1)

    # Get cookies for API calls
    cookies = context.cookies()
    sb_cookies = [
        c
        for c in cookies
        if "supabase" in c.get("name", "").lower() or "sb" in c.get("name", "").lower()
    ]
    print(f"Supabase cookies: {[c['name'] for c in sb_cookies]}")

    # Take screenshot of dashboard
    page.screenshot(path=os.path.join(OUT, "kvant-dashboard.png"), full_page=True)
    print("Dashboard screenshot taken")

    # Navigate to analytics
    page.goto(f"{BASE}/dashboard/analytics", wait_until="networkidle")
    time.sleep(2)
    page.screenshot(path=os.path.join(OUT, "kvant-analytics.png"), full_page=True)

    # Check what's on the page
    body_text = page.locator("body").text_content()
    h1 = page.locator("h1").first
    print(f"\nAnalytics page H1: {h1.text_content() if h1.count() > 0 else 'none'}")

    if "No connected sources" in body_text:
        print("ISSUE: Shows 'No connected sources'")
        # Check if there are any visible errors
        err_section = page.locator(".text-red-400, .text-red-300, [class*='red']")
        if err_section.count() > 0:
            print(f"Error text found: {err_section.first.text_content()[:200]}")
    else:
        print("Page loaded with data - checking cards...")
        cards = page.locator(
            "text=GA4 Sessions, GA4 Pageviews, Meta Ad Spend, Google Ads Spend"
        )
        for text in [
            "GA4 Sessions",
            "GA4 Pageviews",
            "Meta Ad Spend",
            "Google Ads Spend",
        ]:
            el = page.locator(f"text={text}")
            print(f"  {text}: {'FOUND' if el.count() > 0 else 'not found'}")

    # Now call the API directly to see what it returns
    print("\n\nCalling /api/analytics/hub directly...")
    api_url = f"{BASE}/api/analytics/hub?period=this_month"
    cookie_header = "; ".join([f"{c['name']}={c['value']}" for c in cookies])
    r = requests.get(api_url, headers={"Cookie": cookie_header}, timeout=15)
    print(f"API status: {r.status_code}")
    try:
        data = r.json()
        print(f"API response keys: {list(data.keys())}")
        print(f"sources type: {type(data.get('sources')).__name__}")
        if isinstance(data.get("sources"), dict):
            print(
                f"sources keys: {list(data['sources'].keys()) if data['sources'] else 'EMPTY'}"
            )
            for key in data.get("sources", {}):
                print(f"  {key}: {list(data['sources'][key].keys())[:5]}...")
        if data.get("errors"):
            print(f"ERRORS: {json.dumps(data['errors'], indent=2)}")
        if data.get("message"):
            print(f"MESSAGE: {data['message']}")
    except Exception as e:
        print(f"Parse error: {e}")
        print(f"Raw: {r.text[:500]}")

    # Also check connections
    print("\n\nChecking /api/connections/ga4...")
    r2 = requests.get(
        f"{BASE}/api/connections/ga4", headers={"Cookie": cookie_header}, timeout=15
    )
    print(f"GA4 connections API status: {r2.status_code}")
    try:
        print(json.dumps(r2.json(), indent=2)[:1000])
    except:
        print(r2.text[:500])

    browser.close()
