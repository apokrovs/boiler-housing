import {expect, test} from "@playwright/test"
import {randomEmail, randomPassword} from "./utils/random.ts";
import {createUser} from "./utils/privateApi.ts";
import {logInUser} from "./utils/user.ts";

test.use({storageState: {cookies: [], origins: []}})

let email: any
let password: any

test.beforeAll(async () => {
    email = randomEmail();
    password = randomPassword();

    await createUser({email, password});
});

test("My Listings isn't visible by default", async ({page}) => {
    await logInUser(page, email, password)
    await expect(page.getByText("My Listings")).toBeHidden()
})

test("My Listings is visible when leaser", async ({page}) => {
    await logInUser(page, email, password)
    await page.goto("/settings")
    await page.getByRole("tab", {name: "My Profile"}).click()
    await page.getByRole("button", {name: "Edit"}).click()
    await page.getByRole("radio", {name: "Leaser"}).click();
    await page.getByRole("button", {name: "Save"}).click()
    await expect(page.getByText("User updated successfully")).toBeVisible()

    await expect(page.getByText("My Listings")).toBeVisible()
})

test("My Listings is visible when both", async ({page}) => {
    await logInUser(page, email, password)
    await page.goto("/settings")
    await page.getByRole("tab", {name: "My Profile"}).click()
    await page.getByRole("button", {name: "Edit"}).click()
    await page.getByRole("radio", {name: "Both"}).click();
    await page.getByRole("button", {name: "Save"}).click()
    await expect(page.getByText("User updated successfully")).toBeVisible()

    await expect(page.getByText("My Listings")).toBeVisible()
})

test("Create new listing with valid input", async ({page}) => {
    await logInUser(page, email, password)
    await page.goto("/listings")

    await page.getByRole("button", {name: "Add Listing"}).click()
    await page.getByPlaceholder("Street address").fill("My Address")
    await page.getByPlaceholder("Company name").fill("My Company Name")
    await page.selectOption("#num_bedrooms", {label: "Studio"})
    await page.selectOption("#num_bathrooms", {label: "1 Bath"})
    await page.fill("#rent", "1200")
     await page.getByLabel("Security Deposit").check()
    await page.waitForSelector('#security_deposit')
    await page.fill("#security_deposit", "50")
    await page.getByLabel("Water").check()
    await page.getByLabel("Garbage").check()
    await page.getByLabel("Maintenance").check()
    await page.getByLabel("Pool").check()
    await page.fill("#lease_start_date", "2025-08-01")
    await page.fill("#lease_end_date", "2026-07-31")
    await page.getByRole("button", {name: "Add Listing"}).click()

    await expect(page.getByText("My Address")).toBeVisible()
    await expect(page.getByText("My Company Name")).toBeVisible()
    await expect(page.getByText("Studio")).toBeVisible()
    await expect(page.getByText("1 Bath")).toBeVisible()
    await expect(page.getByText("1200")).toBeVisible()
    await expect(page.getByText("50")).toBeVisible()
    await expect(page.getByText("Water")).toBeVisible()
    await expect(page.getByText("Garbage")).toBeVisible()
    await expect(page.getByText("Maintenance")).toBeVisible()
    await expect(page.getByText("Pool")).toBeVisible()
    await expect(page.getByText("2025-08-01")).toBeVisible()
    await expect(page.getByText("2026-07-31")).toBeVisible()
})
