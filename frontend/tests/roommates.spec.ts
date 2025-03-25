import {type Page, test} from "@playwright/test"
import {firstSuperuser, firstSuperuserPassword} from "./config.ts"

test.use({storageState: {cookies: [], origins: []}})

const fillForm = async (page: Page, email: string, password: string) => {
    await page.getByPlaceholder("Email").fill(email)
    await page.getByPlaceholder("Password", {exact: true}).fill(password)
}

test("Roommates Tab is visible and functional", async ({page}) => {
    await page.goto("/login")
    await fillForm(page, firstSuperuser, firstSuperuserPassword)
    await page.getByRole("button", {name: "Log In"}).click()
    await page.waitForURL("/")
    await page.locator('text=Roommates').click()
    await page.goto("/roommates")
})

test("Roommate Recommendation appears after taking quiz", async ({page}) => {
    await page.goto("/login")
    await fillForm(page, firstSuperuser, firstSuperuserPassword)
    await page.getByRole("button", {name: "Log In"}).click()
    await page.waitForURL("/")
    await page.locator('text=Roommates').click()
    await page.goto("/roommates")
    if (await page.locator('text=Reset my selections').isVisible())
        await page.locator('text=Reset my selections').click()
    await page.getByText('Roommate Suggestions').isHidden()
    await page.locator('text=Take the quiz').click()
    await page.goto("roommate-quiz")
    await page.locator('text=Submit').click()
    await page.goto("/roommates")
    await page.getByText('Roommate Suggestions').isVisible()
})