import { useState, useEffect } from "react"
import {
  Container,
  Heading,
  Stack,
  FormControl,
  FormLabel,
  Switch,
  Button,
  Text
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import useAuth from "../../hooks/useAuth"
import useCustomToast from "../../hooks/useCustomToast"
import { UsersService, ApiError } from "../../client"
import { handleError } from "../../utils"

const ProfileVisibility = () => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const { user: currentUser } = useAuth()

  // Local state tracks whether your profile is shown
  const [showProfile, setShowProfile] = useState<boolean>(
    currentUser?.profile_visibility ?? true
  )

  useEffect(() => {
    if (typeof currentUser?.profile_visibility === "boolean") {
    setShowProfile(currentUser.profile_visibility)
  }
  }, [currentUser])

  const mutation = useMutation({
    mutationFn: (profile_visibility: boolean) =>
      UsersService.updateUserMe({ requestBody: { profile_visibility } }),
    onSuccess: () => {
      showToast("Success!", "Profile visibility updated successfully.", "success")
      queryClient.invalidateQueries()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    }
  })

  const handleUpdateVisibility = () => {
    mutation.mutate(showProfile)
  }

  return (
    <Container maxW="md">
      <Heading size="lg" mb={6}>
        Profile Visibility
      </Heading>

      <Stack spacing={4} mb={6}>
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="show-name" mb="0">
            Hide Profile:
          </FormLabel>
          {}
          <Switch
            id="show-name"
            isChecked={!showProfile}
            onChange={() => setShowProfile((prev) => !prev)}
          />
        </FormControl>

        <Button
          colorScheme="yellow"
          onClick={handleUpdateVisibility}
          //isLoading={mutation.isLoading}
        >
          Update Visibility
        </Button>
      </Stack>

      <Heading size="md" mb={4}>
        Current Settings:
      </Heading>
      <Text>
        Profile is {showProfile ? "visible" : "hidden"}
      </Text>
    </Container>
  )
}

export default ProfileVisibility
