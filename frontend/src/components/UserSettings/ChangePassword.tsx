import { useState } from "react"
import {
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  RadioGroup,
  Radio,
  Text,
  Checkbox,
} from "@chakra-ui/react"

const ChangePassword = () => {
  // -----------------------
  // State Hooks
  // -----------------------
  const [currPassword, setCurrPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [recoveryPhone, setRecoveryPhone] = useState("")

  const [autoLogout, setAutoLogout] = useState("10")
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")

  const [enable2FA, setEnable2FA] = useState(false)
  const [twoFAOption, setTwoFAOption] = useState("email")

  const handleChangePassword = async () => {
    // Optional: quick check before sending
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match!")
      return
    }

    try {
      const response = await fetch("http://localhost:5173/api/v1/users/me/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          // Include Auth header if needed:
          // "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currPassword,
          new_password: newPassword,
          confirm_new_password: confirmPassword,
          // If you want to also update recovery info simultaneously,
          // you could include recovery_email / recovery_phone_number here.
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.detail || "Error changing password")
        return
      }

      alert("Password updated successfully!")
    } catch (error) {
      console.error("Error:", error)
      alert("Something went wrong!")
    }
  }

  // --------------------------------------------------------
  // 2) Update Recovery Info
  //    PATCH /api/v1/users/me
  // --------------------------------------------------------
  const handleUpdateRecovery = async () => {
    try {
      const response = await fetch("/api/v1/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recovery_email: recoveryEmail,
          recovery_phone_number: recoveryPhone,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.detail || "Error updating recovery info")
        return
      }

      alert("Recovery info updated!")
    } catch (error) {
      console.error("Error:", error)
      alert("Something went wrong updating recovery info!")
    }
  }

  // --------------------------------------------------------
  // The rest are UI placeholders not yet tied to any endpoints
  // --------------------------------------------------------
  const handleUpdateLogout = () => {
    console.log("Auto logout time: ", autoLogout)
    alert("Automatic logout time updated!")
  }

  const handleSetPin = () => {
    if (pin.length === 4 && pin === confirmPin) {
      alert("PIN successfully set!")
    } else {
      alert("PINs do not match or are not 4 digits.")
    }
  }

  const handleUpdate2FA = () => {
    console.log("2FA Enabled: ", enable2FA)
    console.log("2FA Method: ", twoFAOption)
    alert("Two-factor authentication settings updated!")
  }

  return (
    <Container maxW="md" mt={8}>
      <Heading size="lg" mb={6}>
        Change Password
      </Heading>

      <Stack spacing={4} mb={6}>
        <FormControl>
          <FormLabel>Current Password</FormLabel>
          <Input
            type="password"
            value={currPassword}
            onChange={(e) => setCurrPassword(e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel>New Password</FormLabel>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Confirm New Password</FormLabel>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </FormControl>

        <Button colorScheme="blue" onClick={handleChangePassword}>
          Update Password
        </Button>
      </Stack>

      <Heading size="md" mb={4}>
        Recovery Information
      </Heading>
      <Stack spacing={4} mb={6}>
        <FormControl>
          <FormLabel>Recovery Email</FormLabel>
          <Input
            type="email"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Recovery Phone Number</FormLabel>
          <Input
            type="tel"
            value={recoveryPhone}
            onChange={(e) => setRecoveryPhone(e.target.value)}
          />
        </FormControl>

        <Button colorScheme="blue" onClick={handleUpdateRecovery}>
          Update Recovery Info
        </Button>
      </Stack>

      <Heading size="md" mb={4}>Login Via PIN</Heading>
      <Stack spacing={4} mb={4}>
        <FormControl>
          <FormLabel>Enter 4-digit PIN</FormLabel>
          <Input
            type="number"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Confirm PIN</FormLabel>
          <Input
            type="number"
            maxLength={4}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
          />
        </FormControl>
        <Button colorScheme="blue" onClick={handleSetPin}>
          Set PIN
        </Button>
      </Stack>

      <Heading size="md" mb={4}>
        Two-Factor Authentication
      </Heading>
      <Stack spacing={4} mb={6}>
        <Checkbox
          isChecked={enable2FA}
          onChange={(e) => setEnable2FA(e.target.checked)}
        >
          Enable Two-Factor Authentication
        </Checkbox>
        {enable2FA && (
          <RadioGroup onChange={setTwoFAOption} value={twoFAOption}>
            <Stack direction="row" spacing={6}>
              <Radio value="email">Email</Radio>
              <Radio value="text">Text</Radio>
            </Stack>
          </RadioGroup>
        )}
        <Button colorScheme="blue" onClick={handleUpdate2FA}>
          Update 2FA Settings
        </Button>
      </Stack>

      <Heading size="md" mb={4}>
        Automatic Logout Time
      </Heading>
      <Stack spacing={4} mb={4}>
        <RadioGroup onChange={setAutoLogout} value={autoLogout}>
          <Stack direction="row" spacing={6}>
            <Radio value="10">10 minutes</Radio>
            <Radio value="20">20 minutes</Radio>
            <Radio value="30">30 minutes</Radio>
          </Stack>
        </RadioGroup>
        <Text>Current Setting: {autoLogout} minutes</Text>
        <Button colorScheme="blue" onClick={handleUpdateLogout}>
          Update Auto Logout
        </Button>
      </Stack>
    </Container>
  )
}

export default ChangePassword


    /*const color = useColorModeValue("inherit", "ui.light")
    const showToast = useCustomToast()
    const {
      register,
      handleSubmit,
      reset,
      getValues,
      formState: { errors, isSubmitting },
    } = useForm<UpdatePasswordForm>({
      mode: "onBlur",
      criteriaMode: "all",
    })

    const mutation = useMutation({
      mutationFn: (data: UpdatePassword) =>
        UsersService.updatePasswordMe({ requestBody: data }),
      onSuccess: () => {
        showToast("Success!", "Password updated successfully.", "success")
        reset()
      },
      onError: (err: ApiError) => {
        handleError(err, showToast)
      },
    })

    const onSubmit: SubmitHandler<UpdatePasswordForm> = async (data) => {
      mutation.mutate(data)
    }

    return (
      <>
        <Container maxW="full">
          <Heading size="sm" py={4}>
            Change Password
          </Heading>
          <Box
            w={{ sm: "full", md: "50%" }}
            as="form"
            onSubmit={handleSubmit(onSubmit)}
          >
            <FormControl isRequired isInvalid={!!errors.current_password}>
              <FormLabel color={color} htmlFor="current_password">
                Current Password
              </FormLabel>
              <Input
                id="current_password"
                {...register("current_password")}
                placeholder="Password"
                type="password"
                w="auto"
              />
              {errors.current_password && (
                <FormErrorMessage>
                  {errors.current_password.message}
                </FormErrorMessage>
              )}
            </FormControl>
            <FormControl mt={4} isRequired isInvalid={!!errors.new_password}>
              <FormLabel htmlFor="password">Set Password</FormLabel>
              <Input
                id="password"
                {...register("new_password", passwordRules())}
                placeholder="Password"
                type="password"
                w="auto"
              />
              {errors.new_password && (
                <FormErrorMessage>{errors.new_password.message}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl mt={4} isRequired isInvalid={!!errors.confirm_password}>
              <FormLabel htmlFor="confirm_password">Confirm Password</FormLabel>
              <Input
                id="confirm_password"
                {...register("confirm_password", confirmPasswordRules(getValues))}
                placeholder="Password"
                type="password"
                w="auto"
              />
              {errors.confirm_password && (
                <FormErrorMessage>
                  {errors.confirm_password.message}
                </FormErrorMessage>
              )}
            </FormControl>
            <Button
              variant="primary"
              mt={4}
              type="submit"
              isLoading={isSubmitting}
            >
              Save
            </Button>
          </Box>
        </Container>
      </>
    )
  */

