const puppeteer = require("puppeteer");
const axios = require("axios");
const path = require("path");

// 🔹 Your OpenRouter API key
const OPENROUTER_API_KEY = "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";

// Delay helper
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry click helper
async function clickWithRetry(page, selector, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await page.waitForSelector(selector, { visible: true, timeout: 3000 });
            await page.$eval(selector, el => el.scrollIntoView());
            await page.click(selector);
            return;
        } catch (err) {
            if (i === retries - 1) throw err;
            console.log(`Retrying click for ${selector}...`);
            await delay(1000);
        }
    }
}

// Function to fetch dynamic steps from OpenRouter LLM
async function fetchSteps() {
    const prompt = `
You are an automation planner.
Plan 3-5 steps to fully automate SauceDemo website.
Include actions: goto, type, click, screenshot, and any additional steps (like sorting products, adding multiple products, checkout).
Return the steps as a JSON array with action types and details.
Example format:
[
  { "action": "goto", "url": "https://www.saucedemo.com" },
  { "action": "type", "selector": "#user-name", "value": "standard_user" },
  { "action": "click", "selector": "#login-button" },
  { "action": "screenshot", "path": "01_login.png" }
]
Only return valid JSON, no extra text.
`;

    const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions", { model: "gpt-3.5-turbo", messages: [{ role: "user", content: prompt }] }, { headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" } }
    );

    const generatedText = response.data.choices[0].message.content;

    try {
        return JSON.parse(generatedText);
    } catch (err) {
        console.error("Failed to parse LLM response:", generatedText);
        throw err;
    }
}

(async() => {
    const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

    const browser = await puppeteer.launch({
        executablePath: edgePath,
        headless: false,
        defaultViewport: null,
        args: ["--disable-notifications"]
    });

    const page = await browser.newPage();

    // Handle dialogs automatically
    page.on("dialog", async dialog => {
        console.log("Dialog message:", dialog.message());
        await dialog.dismiss();
    });

    console.log("🚀 Fetching automation steps from LLM...");
    const steps = await fetchSteps();

    console.log("🎯 Executing steps dynamically...");
    for (const step of steps) {
        switch (step.action) {
            case "goto":
                console.log(`📄 Navigating to ${step.url}`);
                await page.goto(step.url, { waitUntil: "networkidle2" });
                await delay(2000);
                break;

            case "type":
                console.log(`👤 Typing into ${step.selector}`);
                await page.waitForSelector(step.selector, { visible: true });
                await page.type(step.selector, step.value, { delay: 150 });
                await delay(1000);
                break;

            case "click":
                console.log(`🖱 Clicking ${step.selector}`);
                try {
                    await clickWithRetry(page, step.selector);
                } catch (err) {
                    console.error(`❌ Failed to click ${step.selector}:`, err.message);
                }
                await delay(1500);
                break;

            case "screenshot":
                const screenshotPath = path.resolve(step.path);
                console.log(`📸 Taking screenshot: ${screenshotPath}`);
                await page.screenshot({ path: screenshotPath });
                await delay(1000);
                break;

            default:
                console.log(`⚠️ Unknown action: ${step.action}`);
                await delay(1000);
        }
    }

    console.log("🎉 LLM-driven SauceDemo automation completed!");
    await browser.close();
})();