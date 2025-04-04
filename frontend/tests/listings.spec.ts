import {expect, test} from "@playwright/test"
import {randomEmail, randomPassword} from "./utils/random.ts";
import {createUser, createUserWithProfile} from "./utils/privateApi.ts";
import {logInUser} from "./utils/user.ts";

test.use({storageState: {cookies: [], origins: []}})

let email: any
let password: any
let profile_type: any

test.beforeAll(async () => {
    email = randomEmail();
    password = randomPassword();
    profile_type = "Leaser";

    await createUserWithProfile({email, password, profile_type});
});

test("My Listings isn't visible by default", async ({page}) => {
    const email = randomEmail();
    const password = randomPassword();

    await createUser({email, password});
    await logInUser(page, email, password)
    await expect(page.getByText("My Listings")).toBeHidden()
})

test("My Listings is visible when leaser", async ({page}) => {
    await logInUser(page, email, password)
    await expect(page.getByText("My Listings")).toBeVisible()
})

test("My Listings is visible when both", async ({page}) => {
    email = randomEmail();
    password = randomPassword();
    profile_type = "Both";

    await createUserWithProfile({email, password, profile_type});
    await logInUser(page, email, password)

    await expect(page.getByText("My Listings")).toBeVisible()
})

test("Can create a listing", async ({page}) => {
    await logInUser(page, email, password)
    await page.goto("/listings")
    await expect(page.getByText("Add Listing")).toBeVisible();
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
    await page.fill("#lease_start_date", "2025-08-01")
    await page.fill("#lease_end_date", "2026-07-31")
    await page.getByRole("button", {name: "Add Listing"}).click()

    await expect(page.getByText("My Address")).toBeVisible()
    await expect(page.getByText("My Company Name")).toBeVisible()
    await expect(page.locator('span.chakra-badge:has-text("STUDIO")')).toBeVisible()
    await expect(page.locator('span.chakra-badge:has-text("1 BATH")')).toBeVisible()
    await expect(page.getByText("$1,200")).toBeVisible()
    await expect(page.getByText("2025-08-01")).toBeVisible()
    await expect(page.getByText("2026-07-31")).toBeVisible()
})

test("Create new listing with invalid input", async ({page}) => {
    await logInUser(page, email, password)
    await page.goto("/listings")
    await page.getByRole("button", {name: "Add Listing"}).click()
    await page.getByPlaceholder("Street address").fill("My Address")
    await expect(page.getByRole('button', {name: 'Add Listing', exact: true})).toBeDisabled();
})

test("Edit existing listing with valid input", async ({page}) => {
    await logInUser(page, email, password)
    await page.goto("/listings")

    await page.getByRole("button", {name: "Add Listing"}).click()
    await page.getByPlaceholder("Street address").fill("My Address")
    await page.getByPlaceholder("Company name").fill("My Company Name")
    await page.selectOption("#num_bedrooms", {label: "Studio"})
    await page.selectOption("#num_bathrooms", {label: "1 Bath"})
    await page.fill("#rent", "1200")
    await page.fill("#lease_start_date", "2025-08-01")
    await page.fill("#lease_end_date", "2026-07-31")
    await page.getByRole("button", {name: "Add Listing"}).click()

    await page.getByRole("button", {name: "Edit listing"}).click()
    await page.getByPlaceholder("Street address").fill("My New Address")
    await page.getByRole("button", {name: "Update Listing"}).click()

    await expect(page.getByText("My New Address")).toBeVisible()
    await expect(page.getByText("My Company Name")).toBeVisible()
    await expect(page.locator('span.chakra-badge:has-text("STUDIO")')).toBeVisible()
    await expect(page.locator('span.chakra-badge:has-text("1 BATH")')).toBeVisible()
    await expect(page.getByText("$1,200")).toBeVisible()
    await expect(page.getByText("2025-08-01")).toBeVisible()
    await expect(page.getByText("2026-07-31")).toBeVisible()
})

test("Edit existing listing with invalid input", async ({page}) => {
    await logInUser(page, email, password)
    await page.goto("/listings")

    await page.getByRole("button", {name: "Edit listing"}).click()
    await page.fill("#lease_start_date", "2027-08-01")
    await expect(page.getByRole('button', {name: 'Update Listing', exact: true})).toBeDisabled();
})

test("Delete existing listing", async ({page}) => {
    await logInUser(page, email, password)
    await page.goto("/listings")

    await page.getByRole("button", {name: "Add Listing"}).click()
    await page.getByPlaceholder("Street address").fill("My Address")
    await page.getByPlaceholder("Company name").fill("My Company Name")
    await page.selectOption("#num_bedrooms", {label: "Studio"})
    await page.selectOption("#num_bathrooms", {label: "1 Bath"})
    await page.fill("#rent", "1200")
    await page.fill("#lease_start_date", "2025-08-01")
    await page.fill("#lease_end_date", "2026-07-31")
    await page.getByRole("button", {name: "Add Listing"}).click()

    await page.getByRole("button", {name: "Delete Listing"}).click()
    await page.getByRole("button", {name: "Delete"}).click()
    await expect(page.getByText("The listing was deleted successfully.")).toBeVisible()
})
