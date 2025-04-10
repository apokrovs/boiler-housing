import {type Page, test} from "@playwright/test"
import {firstSuperuser, firstSuperuserPassword} from "./config.ts"

test.use({storageState: {cookies: [], origins: []}})

// These test MUST have admin set as both renter and leaser

const fillForm = async (page: Page, email: string, password: string) => {
    await page.getByPlaceholder("Email").fill(email)
    await page.getByPlaceholder("Password", {exact: true}).fill(password)
}

test("Navigate to user roommates page", async ({page}) => {
    await page.goto("/login")
    await fillForm(page, firstSuperuser, firstSuperuserPassword)
    await page.getByRole("button", {name: "Log In"}).click()
    await page.waitForURL("/")
    await page.locator('text=Roommates').click()
    await page.goto("/roommates")
})

test("Navigate to user roommate agreement page", async ({page}) => {
    await page.goto("/login")
    await fillForm(page, firstSuperuser, firstSuperuserPassword)
    await page.getByRole("button", {name: "Log In"}).click()
    await page.waitForURL("/")
    await page.locator('text=Roommate Agreement').click()
    await page.goto("/roommate_agreement")
})

test("Navigate to user roommate renter search page", async ({page}) => {
    await page.goto("/login")
    await fillForm(page, firstSuperuser, firstSuperuserPassword)
    await page.getByRole("button", {name: "Log In"}).click()
    await page.waitForURL("/")
    await page.locator('text=Renter Search').click()
    await page.goto("/renter_search")
})

test("Navigate to user settings page", async ({page}) => {
    await page.goto("/login")
    await fillForm(page, firstSuperuser, firstSuperuserPassword)
    await page.getByRole("button", {name: "Log In"}).click()
    await page.waitForURL("/")
    await page.locator('text=User Settings').click()
    await page.goto("/settings")
})

test("Navigate to faq from navbar", async ({page}) => {
    await page.goto("/login")
    await fillForm(page, firstSuperuser, firstSuperuserPassword)
    await page.getByRole("button", {name: "Log In"}).click()
    await page.waitForURL("/")
    await page.getByText("FAQ").first().click()
    await page.goto("/faq")
})

test("Navigate to faq from user menu", async ({page}) => {
    await page.goto("/login")
    await fillForm(page, firstSuperuser, firstSuperuserPassword)
    await page.getByRole("button", {name: "Log In"}).click()
    await page.waitForURL("/")
    await page.getByTestId("user-menu").click()
    await page.getByText("FAQ").first().click()
    await page.goto("/faq")
})

test("Navigate to user renter listings", async ({page}) => {
    await page.goto("/login")
    await fillForm(page, firstSuperuser, firstSuperuserPassword)
    await page.getByRole("button", {name: "Log In"}).click()
    await page.waitForURL("/")
    await page.getByText("Listings").first().click()
    await page.goto("/renter_listings")
})

test("Navigate to user leaser listings", async ({page}) => {
    await page.goto("/login")
    await fillForm(page, firstSuperuser, firstSuperuserPassword)
    await page.getByRole("button", {name: "Log In"}).click()
    await page.waitForURL("/")
    await page.getByText("My Listings").first().click()
    await page.goto("/leaser_listings")
})

test("Navigate to user messages page", async ({page}) => {
    await page.goto("/login")
    await fillForm(page, firstSuperuser, firstSuperuserPassword)
    await page.getByRole("button", {name: "Log In"}).click()
    await page.waitForURL("/")
    await page.getByText("Messages").click({force: true})
    await page.goto("/messages")
})

test("Logout from user menu", async ({page}) => {
    await page.goto("/login")
    await fillForm(page, firstSuperuser, firstSuperuserPassword)
    await page.getByRole("button", {name: "Log In"}).click()
    await page.waitForURL("/")
    await page.getByTestId("user-menu").click()
    await page.getByText("Log out").click()
    await page.goto("/login")
})

test("Navigate to dashboard from dashboard button", async ({page}) => {
    await page.goto("/login")
    await fillForm(page, firstSuperuser, firstSuperuserPassword)
    await page.getByRole("button", {name: "Log In"}).click()
    await page.waitForURL("/")
    await page.getByText("FAQ").first().click()
    await page.goto("/faq")
    await page.getByText("Dashboard").click()
    await page.goto("/")
})

test("Navigate to dashboard from logo", async ({page}) => {
    await page.goto("/login")
    await fillForm(page, firstSuperuser, firstSuperuserPassword)
    await page.getByRole("button", {name: "Log In"}).click()
    await page.waitForURL("/")
    await page.getByText("FAQ").first().click()
    await page.goto("/faq")
    await page.getByTestId("home_logo").click()
    await page.goto("/")
})