from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        print("Navigating...")
        try:
            page.goto("http://localhost:3000/cbt/interface", timeout=60000, wait_until="domcontentloaded")
        except Exception as e:
             print(f"Goto failed or timed out: {e}")
             # try to continue anyway if some content loaded

        # Wait for page to load
        # .cbt-container is on the root div
        try:
            page.wait_for_selector(".cbt-container", timeout=30000)
            print("Found .cbt-container")

            # Wait a bit for content
            time.sleep(5)

            # Take screenshot of settings panel
            page.screenshot(path="verification_settings.png")
            print("Screenshot taken: verification_settings.png")

        except Exception as e:
            print(f"Error finding selector: {e}")
            page.screenshot(path="verification_error.png")

        browser.close()

if __name__ == "__main__":
    run()
