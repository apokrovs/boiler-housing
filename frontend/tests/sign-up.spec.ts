import { type Page, expect, test } from "@playwright/test"

import { randomEmail, randomPassword, randomPhoneNumber } from "./utils/random"

test.use({ storageState: { cookies: [], origins: [] } })

type OptionsType = {
  exact?: boolean
}

const fillForm = async (
  page: Page,
  full_name: string,
  email: string,
  phone_number: string,
  password: string,
  confirm_password: string,
) => {
  await page.getByPlaceholder("Full Name").fill(full_name)
  await page.getByPlaceholder("Email").fill(email)
  await page.getByPlaceholder("Phone XXXXXXXXXX").fill(phone_number)
  await page.getByPlaceholder("Password", { exact: true }).fill(password)
  await page.getByPlaceholder("Repeat Password").fill(confirm_password)
}

const verifyInput = async (
  page: Page,
  placeholder: string,
  options?: OptionsType,
) => {
  const input = page.getByPlaceholder(placeholder, options)
  await expect(input).toBeVisible()
  await expect(input).toHaveText("")
  await expect(input).toBeEditable()
}

test("Inputs are visible, empty and editable", async ({ page }) => {
  await page.goto("/signup")

  await verifyInput(page, "Full Name")
  await verifyInput(page, "Email")
  await verifyInput(page, "Phone XXXXXXXXXX")
  await verifyInput(page, "Password", { exact: true })
  await verifyInput(page, "Repeat Password")
})

test("Sign Up button is visible", async ({ page }) => {
  await page.goto("/signup")

  await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible()
})

test("Log In link is visible", async ({ page }) => {
  await page.goto("/signup")

  await expect(page.getByRole("link", { name: "Log In" })).toBeVisible()
})

test("Sign up with valid sender_name, email, phone_number and password", async ({ page }) => {
  const full_name = "Test User"
  const email = randomEmail()
  const password = randomPassword()
  const phone_number = randomPhoneNumber()

  await page.goto("/signup")
  await fillForm(page, full_name, email, phone_number, password, password)
  await page.getByRole("button", { name: "Sign Up" }).click()
})

test("Sign up with invalid email", async ({ page }) => {
  await page.goto("/signup")

  await fillForm(
    page,
    "Playwright Test",
    "invalid-email",
    "valid-phone",
    "changethis",
      "changethis"
  )
  await page.getByRole("button", { name: "Sign Up" }).click()

  await expect(page.getByText("Invalid email address")).toBeVisible()
})

test("Sign up with existing email", async ({ page }) => {
  const fullName = "Test User"
  const email = randomEmail()
  const password = randomPassword()
  const phone_number = randomPhoneNumber()
  const phone_number2 = randomPhoneNumber()

  // Sign up with an email
  await page.goto("/signup")

  await fillForm(page, fullName, email, phone_number, password, password)
  await page.getByRole("button", { name: "Sign Up" }).click()

  // Sign up again with the same email
  await page.goto("/signup")

  await fillForm(page, fullName, email, phone_number2, password, password)
  await page.getByRole("button", { name: "Sign Up" }).click()

  await page
    .getByText("The user with this email or phone number already exists in the system")
    .click()
})

test("Sign up with weak password", async ({ page }) => {
  const fullName = "Test User"
  const email = randomEmail()
  const password = "weak"
  const phone_number = randomPhoneNumber()

  await page.goto("/signup")

  await fillForm(page, fullName, email, phone_number, password, password)
  await page.getByRole("button", { name: "Sign Up" }).click()

  await expect(
    page.getByText("Password must be at least 8 characters"),
  ).toBeVisible()
})

test("Sign up with mismatched passwords", async ({ page }) => {
  const fullName = "Test User"
  const email = randomEmail()
  const password = randomPassword()
  const password2 = randomPassword()
  const phone_number = randomPhoneNumber()

  await page.goto("/signup")

  await fillForm(page, fullName, email, phone_number, password, password2)
  await page.getByRole("button", { name: "Sign Up" }).click()

  await expect(page.getByText("Passwords do not match")).toBeVisible()
})

test("Sign up with missing full sender_name", async ({ page }) => {
  const fullName = ""
  const email = randomEmail()
  const password = randomPassword()
  const phone_number = randomPhoneNumber()

  await page.goto("/signup")

  await fillForm(page, fullName, email, phone_number, password, password)
  await page.getByRole("button", { name: "Sign Up" }).click()

  await expect(page.getByText("Full Name is required")).toBeVisible()
})

test("Sign up with missing email", async ({ page }) => {
  const fullName = "Test User"
  const email = ""
  const password = randomPassword()
  const phone_number = randomPhoneNumber()

  await page.goto("/signup")

  await fillForm(page, fullName, email, phone_number, password, password)
  await page.getByRole("button", { name: "Sign Up" }).click()

  await expect(page.getByText("Email is required")).toBeVisible()
})

test("Sign up with missing password", async ({ page }) => {
  const fullName = ""
  const email = randomEmail()
  const password = ""
  const phone_number = randomPhoneNumber()

  await page.goto("/signup")

  await fillForm(page, fullName, email, phone_number, password, password)
  await page.getByRole("button", { name: "Sign Up" }).click()

  await expect(page.getByText("Password is required")).toBeVisible()
})