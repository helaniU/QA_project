const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

(async function signupTests() {
  let options = new chrome.Options();
  options.addArguments(
    //"--headless",
    "--disable-logging",
    "--log-level=3",
    "--silent"
  );

  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    // ======================
    // Test 1: Successful signup
    // ======================
    console.log("Test 1: Successful signup");
    await driver.get("http://localhost:5173/register");

    await driver.wait(until.elementLocated(By.name("name")), 5000).sendKeys("Helani");
    
    const uniqueEmail = `user${Date.now()}@example.com`;
    await driver.wait(until.elementLocated(By.name("email")), 5000).sendKeys(uniqueEmail);
    
    await driver.wait(until.elementLocated(By.name("password")), 5000).sendKeys("Password123");
    
    await driver.findElement(By.css("button[type='submit']")).click();

    try {
      await driver.wait(until.urlContains("/login"), 10000);
      console.log("✅ Signup successful test passed");
    } catch {
      console.log("❌ Signup did not redirect to /login");
    }

    // ======================
    // Test 2: Invalid email
    // ======================
    console.log("Test 2: Login with invalid email");
    await driver.get("http://localhost:5173/register");

    await driver.wait(until.elementLocated(By.name("name")), 5000).sendKeys("Helani");
    await driver.wait(until.elementLocated(By.name("email")), 5000).sendKeys("helaniexample.com");
    await driver.wait(until.elementLocated(By.name("password")), 5000).sendKeys("Password123");

    await driver.findElement(By.css("button[type='submit']")).click();

    // Wait a moment for any validation to occur
    await driver.sleep(1000);

    // Try multiple selectors for error messages
    const errorSelectors = [
      '.error',
      '.error-message',
      '.text-danger',
      '[role="alert"]',
      '.alert',
      '.alert-danger',
      '[data-testid="error-message"]',
      '[class*="error"]',
      '[class*="Error"]'
    ];

    let errorFound = false;
    
    for (const selector of errorSelectors) {
      try {
        const errorElements = await driver.findElements(By.css(selector));
        if (errorElements.length > 0) {
          for (const element of errorElements) {
            const text = await element.getText();
            if (text && text.length > 0) {
              console.log(`✅ Invalid email error found (${selector}):`, text);
              errorFound = true;
              break;
            }
          }
        }
        if (errorFound) break;
      } catch (e) {
        // Continue to next selector
      }
    }

    // Check if form is still on the same page (indicating failed submission)
    if (!errorFound) {
      const currentUrl = await driver.getCurrentUrl();
      if (currentUrl.includes('/register')) {
        console.log("✅ Form did not submit (expected behavior for invalid email)");
        errorFound = true;
      }
    }

    // Check for browser validation (HTML5 validation)
    if (!errorFound) {
      try {
        const emailField = await driver.findElement(By.name('email'));
        const isInvalid = await emailField.getAttribute('aria-invalid');
        const validationMessage = await emailField.getAttribute('validationMessage');
        
        if (isInvalid === 'true' || validationMessage) {
          console.log("✅ Browser validation triggered:", validationMessage || 'Invalid email');
          errorFound = true;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!errorFound) {
      console.log("❌ No error message or validation was found for invalid email");
      
      // Debug: Take screenshot to see what's happening
      const screenshot = await driver.takeScreenshot();
      require('fs').writeFileSync('debug-invalid-email.png', screenshot, 'base64');
      console.log("📸 Screenshot saved as debug-invalid-email.png");
    }

  } catch (error) {
    console.log("❌ Test suite error:", error.message);
  } finally {
    await driver.quit();
  }
})();