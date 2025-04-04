// Note: the `PrivateService` is only available when generating the client
// for local environments
import { OpenAPI, PrivateService } from "../../src/client"

OpenAPI.BASE = `${process.env.VITE_API_URL}`

export const createUser = async ({
  email,
  password,
}: {
  email: string
  password: string
}) => {
  return await PrivateService.createUser({
    requestBody: {
      email,
      password,
      is_verified: true,
      full_name: "Test User",
    },
  })
}

export const createUserWithProfile = async ({
  email,
  password, profile_type
}: {
  email: string
  password: string
    profile_type: string
}) => {
  return await PrivateService.createUserWithProfile({
    requestBody: {
      email,
      password, profile_type,
      is_verified: true,
      full_name: "Test User",
    },
  })
}
