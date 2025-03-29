import {
    Button,
    Container,
    FormControl,
    FormErrorMessage,
    Heading,
    Input,
    Text,
} from "@chakra-ui/react"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useState } from "react"

import { isLoggedIn } from "../hooks/useAuth"
import useCustomToast from "../hooks/useCustomToast"
import { emailPattern } from "../utils"
import { sendOTPNotification } from "../client/emailService"

interface FormData {
    email: string
}

export const Route = createFileRoute("/recover-password")({
    component: RecoverPassword,
    beforeLoad: async () => {
        if (isLoggedIn()) {
            throw redirect({ to: "/" })
        }
    },
})

function RecoverPassword() {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormData>()
    const showToast = useCustomToast()
    const navigate = useNavigate()

    const [storedOtp, setStoredOtp] = useState("")
    const [inputOTP, setInputOTP] = useState("")
    const [isOtpSent, setIsOtpSent] = useState(false)
    const [userEmail, setUserEmail] = useState("")

    function generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString()
    }

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        const otp = generateOTP()
        setStoredOtp(otp)
        setUserEmail(data.email)
        await sendOTPNotification(data.email, "User", otp)
        setIsOtpSent(true)
        showToast("OTP Sent", "Check your email for the OTP code.", "success")
        reset()
    }

    const verifyOTP = () => {
        if (inputOTP === storedOtp) {
            navigate({
                to: "/reset-password",
                search: { token: storedOtp, email: userEmail },
            })
        } else {
            showToast("Error", "Invalid OTP or expired code.", "error")
            setIsOtpSent(false)
            setInputOTP("")
            setStoredOtp("")
        }
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
                Password Recovery
            </Heading>
            <Text textAlign="center">
                You will receive an OTP to your email.
            </Text>

            <FormControl isInvalid={!!errors.email}>
                <Input
                    id="email"
                    {...register("email", {
                        required: "Email is required",
                        pattern: emailPattern,
                    })}
                    placeholder="Email"
                    type="email"
                    isDisabled={isOtpSent}
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                />
                {errors.email && (
                    <FormErrorMessage>{errors.email.message}</FormErrorMessage>
                )}
            </FormControl>

            {!isOtpSent ? (
                <Button variant="primary" type="submit" isLoading={isSubmitting}>
                    Send OTP
                </Button>
            ) : (
                <>
                    <FormControl mt={4}>
                        <Input
                            id="otp"
                            placeholder="Enter OTP"
                            value={inputOTP}
                            onChange={(e) => setInputOTP(e.target.value)}
                        />
                    </FormControl>
                    <Button variant="primary" onClick={verifyOTP} mt={2}>
                        Verify OTP
                    </Button>
                </>
            )}
        </Container>
    )
}
