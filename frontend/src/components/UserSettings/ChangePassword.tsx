import {useEffect, useState} from "react"

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
    Text
} from "@chakra-ui/react"
import useAuth from "../../hooks/useAuth.ts";
/*
import {useMutation} from "@tanstack/react-query"
import {type SubmitHandler, useForm} from "react-hook-form"

import {type ApiError, type UpdatePassword, UsersService} from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import {confirmPasswordRules, handleError, passwordRules} from "../../utils"

interface UpdatePasswordForm extends UpdatePassword {
    confirm_password: string
}*/

const ChangePassword = () => {
    const {user} = useAuth()
    const [currPassword, setCurrPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const [recoveryEmail, setRecoveryEmail] = useState("")
    const [phone, setRecoveryPhone] = useState("")

    const [autoLogout, setAutoLogout] = useState("")

    useEffect(() => {
        if(user?.auto_logout) {
            setAutoLogout(String(user.auto_logout))
        }
    }, [user])

    const handleChangePassword = () => {
        console.log("Current Password: ", currPassword)
        console.log("New Password: ", newPassword)
        console.log("Confirm Password: ", confirmPassword)
        alert("Password change requested")
    }

    const handleUpdateRecovery = () => {
        console.log("Recover Email: ", recoveryEmail)
        console.log("Phone Number: ", phone)
        alert("Recovery info updated")
    }

    const handleUpdateLogout = () => {
        console.log("Auto logout time: ", autoLogout)
        alert("Automatic logout time updated!")
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
                        value={phone}
                        onChange={(e) => setRecoveryPhone(e.target.value)}

                    />
                </FormControl>

                <Button colorScheme="blue" onClick={handleUpdateRecovery}>
                    Update Recovery Info
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
}
export default ChangePassword
