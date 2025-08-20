const puppeteer = require("puppeteer");

(async() => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", // Windows path
        args: ["--disable-notifications"]
    });

    const page = await browser.newPage();

    // Handle any alert/confirm/prompt dialog automatically
    page.on("dialog", async(dialog) => {
        console.log("Dialog message:", dialog.message());
        await dialog.dismiss();
    });

    console.log("🚀 Starting SauceDemo automation...");

    // Step 1: Go to saucedemo
    console.log("📄 Navigating to SauceDemo...");
    await page.goto("https://www.saucedemo.com/", { waitUntil: "networkidle2" });
    await page.screenshot({ path: "01_login_page.png" });

    // Step 2: Fill login form
    console.log("👤 Filling login credentials...");
    await page.type("#user-name", "standard_user", { delay: 200 });
    await page.type("#password", "secret_sauce", { delay: 200 });
    await page.screenshot({ path: "02_filled_login.png" });

    console.log("🔑 Logging in...");
    await page.click("#login-button");
    await page.waitForSelector(".inventory_list", { timeout: 10000 });
    await page.screenshot({ path: "03_products_page.png" });

    // Step 3: Add multiple products to cart
    console.log("🛒 Adding products to cart...");
    const productButtons = await page.$$(".inventory_item .btn_inventory");

    if (productButtons.length >= 3) {
        console.log("   Adding Sauce Labs Backpack...");
        await productButtons[0].click();

        console.log("   Adding Sauce Labs Bike Light...");
        await productButtons[1].click();

        console.log("   Adding Sauce Labs Bolt T-Shirt...");
        await productButtons[2].click();
    } else {
        console.log("⚠️ Not enough products found!");
    }

    await page.screenshot({ path: "04_products_added.png" });

    // Step 4: View cart badge
    console.log("🔍 Checking cart badge...");
    const cartBadge = await page.$(".shopping_cart_badge");
    if (cartBadge) {
        const badgeText = await page.evaluate(el => el.textContent, cartBadge);
        console.log(`   Cart has ${badgeText} items`);
    }

    // Step 5: Go to cart
    console.log("🛒 Opening cart...");
    await page.click(".shopping_cart_link");
    await page.waitForSelector(".cart_list", { timeout: 5000 });
    await page.screenshot({ path: "05_cart_page.png" });

    // Step 6: Verify cart items
    console.log("✅ Verifying cart contents...");
    const cartItems = await page.$$(".cart_item");
    console.log(`   Found ${cartItems.length} items in cart`);

    for (let i = 0; i < cartItems.length; i++) {
        const itemName = await cartItems[i].$eval(".inventory_item_name", el => el.textContent);
        const itemPrice = await cartItems[i].$eval(".inventory_item_price", el => el.textContent);
        console.log(`   Item ${i + 1}: ${itemName} - ${itemPrice}`);
    }

    // Step 7: Proceed to checkout
    console.log("💳 Proceeding to checkout...");
    await page.click("#checkout");
    await page.waitForSelector(".checkout_info", { timeout: 5000 });
    await page.screenshot({ path: "06_checkout_info.png" });

    // Step 8: Fill checkout information
    console.log("📝 Filling checkout information...");
    await page.type("#first-name", "John", { delay: 150 });
    await page.type("#last-name", "Doe", { delay: 150 });
    await page.type("#postal-code", "12345", { delay: 150 });
    await page.screenshot({ path: "07_filled_checkout_info.png" });

    console.log("➡️ Continuing to overview...");
    await page.click("#continue");
    await page.waitForSelector(".checkout_summary_container", { timeout: 5000 });
    await page.screenshot({ path: "08_checkout_overview.png" });

    // Step 9: Review order summary
    console.log("📋 Reviewing order summary...");
    const subtotal = await page.$eval(".summary_subtotal_label", el => el.textContent);
    const tax = await page.$eval(".summary_tax_label", el => el.textContent);
    const total = await page.$eval(".summary_total_label", el => el.textContent);

    console.log(`   ${subtotal}`);
    console.log(`   ${tax}`);
    console.log(`   ${total}`);

    // Step 10: Complete the order
    console.log("🎯 Finishing the order...");
    await page.click("#finish");
    await page.waitForSelector(".checkout_complete_container", { timeout: 5000 });
    await page.screenshot({ path: "09_order_complete.png" });

    // Step 11: Verify completion
    const confirmationMessage = await page.$eval(".complete-header", el => el.textContent);
    console.log(`   ✅ ${confirmationMessage}`);

    // Step 12: Return to products
    console.log("🔄 Returning to products page...");
    await page.click("#back-to-products");
    await page.waitForSelector(".inventory_list", { timeout: 5000 });
    await page.screenshot({ path: "10_back_to_products.png" });

    // Step 13: Final screenshot
    console.log("📸 Taking final screenshot...");
    await page.screenshot({ path: "11_final_state.png" });

    console.log("🎉 Demo completed successfully!");
    console.log("📁 Screenshots saved:");
    console.log("   - 01_login_page.png");
    console.log("   - 02_filled_login.png");
    console.log("   - 03_products_page.png");
    console.log("   - 04_products_added.png");
    console.log("   - 05_cart_page.png");
    console.log("   - 06_checkout_info.png");
    console.log("   - 07_filled_checkout_info.png");
    console.log("   - 08_checkout_overview.png");
    console.log("   - 09_order_complete.png");
    console.log("   - 10_back_to_products.png");
    console.log("   - 11_final_state.png");

    await browser.close();
})();