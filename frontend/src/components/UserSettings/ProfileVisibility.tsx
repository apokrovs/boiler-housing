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
    // If user data changes, sync local state
    if (currentUser?.profile_visibility !== undefined) {
      setShowProfile(currentUser.profile_visibility)
    }
  }, [currentUser])

  // Mutation to update only the profile_visibility field
  const mutation = useMutation({
    mutationFn: (profile_visibility: boolean) =>
      UsersService.updateUserMe({ requestBody: { profile_visibility } }),
    onSuccess: () => {
      showToast("Success!", "Profile visibility updated successfully.", "success")
      // Force-refetch user data so the UI is up to date
      queryClient.invalidateQueries()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    }
  })

  const handleUpdateVisibility = () => {
    // Call mutate with the updated state
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
          {/*
            If isChecked = true, that means "Hide Profile" is ON =>
            showProfile is false. So we invert showProfile here.
          */}
          <Switch
            id="show-name"
            isChecked={!showProfile}
            onChange={() => setShowProfile((prev) => !prev)}
          />
        </FormControl>

        <Button
          colorScheme="blue"
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
