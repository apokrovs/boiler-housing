import {expect, test} from "@playwright/test"
import {logInUser} from "./utils/user"
import {randomEmail, randomPassword} from "./utils/random.ts";
import {createUser} from "./utils/privateApi.ts";

// Use same user for all tests
/*const email = randomEmail()
const password = randomPassword()
await createUser({email, password})*/

test("My Listings tab is inactive by default", async ({page}) => {
    const email = randomEmail()
    const password = randomPassword()
    await createUser({email, password})

    await logInUser(page, email, password)
    await expect(page.getByRole("tab", {name: "My Listings"})).toHaveAttribute(
        "aria-selected",
        "false",
    )
})