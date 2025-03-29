import {
    Button,
    Container,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Heading,
    Input,
    InputGroup,
    InputRightElement,
    Text,
} from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate, useSearch } from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useState } from "react"

import { type ApiError, LoginService } from "../client"
import { isLoggedIn } from "../hooks/useAuth"
import useCustomToast from "../hooks/useCustomToast"
import { confirmPasswordRules, handleError, passwordRules } from "../utils"

interface NewPasswordForm {
    new_password: string
    confirm_password: string
}

export const Route = createFileRoute("/reset-password")({
    component: ResetPassword,
    beforeLoad: async () => {
        if (isLoggedIn()) {
            throw redirect({ to: "/" })
        }
    },
})

function ResetPassword() {
    const {
        register,
        handleSubmit,
        getValues,
        reset,
        formState: { errors },
    } = useForm<NewPasswordForm>({
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: {
            new_password: "",
            confirm_password: "",
        },
    })

    const showToast = useCustomToast()
    const navigate = useNavigate()
    const search = useSearch({ from: "/reset-password" }) as { email?: string }

    const email = search.email

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const togglePasswordVisibility = () => setShowPassword(!showPassword)
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword)

    if (!email) {
        showToast("Error", "Missing email parameter.", "error")
        return null
    }

    const resetPassword = async (data: NewPasswordForm) => {
        await LoginService.resetPassword({
            requestBody: {
                email: email,
                new_password: data.new_password,
            },
        })
    }

    const mutation = useMutation({
        mutationFn: resetPassword,
        onSuccess: () => {
            showToast("Success!", "Password updated successfully.", "success")
            reset()
            navigate({ to: "/login" })
        },
        onError: (err: ApiError) => {
            handleError(err, showToast)
        },
    })

    const onSubmit: SubmitHandler<NewPasswordForm> = async (data) => {
        mutation.mutate(data)
    }

    return (
        <Container
            as="form"
            onSubmit={handleSubmit(onSubmit)}
            h="100vh"
            maxW="sm"
            alignItems="stretch"
            justifyContent="center"
            gap={4}
            centerContent
        >
            <Heading size="xl" color="ui.main" textAlign="center" mb={2}>
                Reset Password
            </Heading>
            <Text textAlign="center">
                Enter your new password and confirm it.
            </Text>

            <FormControl mt={4} isInvalid={!!errors.new_password}>
                <FormLabel htmlFor="password">New Password</FormLabel>
                <InputGroup>
                    <Input
                        id="password"
                        {...register("new_password", passwordRules())}
                        placeholder="New Password"
                        type={showPassword ? "text" : "password"}
                    />
                    <InputRightElement width="4.5rem">
                        <Button h="1.75rem" size="sm" onClick={togglePasswordVisibility}>
                            {showPassword ? "Hide" : "Show"}
                        </Button>
                    </InputRightElement>
                </InputGroup>
                {errors.new_password && (
                    <FormErrorMessage>{errors.new_password.message}</FormErrorMessage>
                )}
            </FormControl>

            <FormControl mt={4} isInvalid={!!errors.confirm_password}>
                <FormLabel htmlFor="confirm_password">Confirm Password</FormLabel>
                <InputGroup>
                    <Input
                        id="confirm_password"
                        {...register("confirm_password", confirmPasswordRules(getValues))}
                        placeholder="Confirm Password"
                        type={showConfirmPassword ? "text" : "password"}
                    />
                    <InputRightElement width="4.5rem">
                        <Button h="1.75rem" size="sm" onClick={toggleConfirmPasswordVisibility}>
                            {showConfirmPassword ? "Hide" : "Show"}
                        </Button>
                    </InputRightElement>
                </InputGroup>
                {errors.confirm_password && (
                    <FormErrorMessage>{errors.confirm_password.message}</FormErrorMessage>
                )}
            </FormControl>

            <Button variant="primary" type="submit" mt={4}>
                Reset Password
            </Button>
        </Container>
    )
}
