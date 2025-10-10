import asyncio
import os
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Listen for console events and print them
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        await page.goto(f"file://{os.getcwd()}/index.html")
        await page.wait_for_timeout(5000)  # 5 seconds
        await page.screenshot(path="jules-scratch/verification/verification.png")
        await browser.close()

asyncio.run(main())