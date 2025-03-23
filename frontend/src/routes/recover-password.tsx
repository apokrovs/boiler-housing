import {
    Button,
    Container,
    FormControl,
    FormErrorMessage,
    Heading,
    Input,
    Text,
} from "@chakra-ui/react"
import {useMutation} from "@tanstack/react-query"
import {createFileRoute, redirect} from "@tanstack/react-router"
import {type SubmitHandler, useForm} from "react-hook-form"

import {type ApiError, LoginService} from "../client"
import {isLoggedIn} from "../hooks/useAuth"
import useCustomToast from "../hooks/useCustomToast"
import {emailPattern, handleError} from "../utils"
import {sendOTPNotification} from "../client/emailService.ts";
import {useState} from "react";
import {useNavigate} from "@tanstack/react-router";

interface FormData {
    email: string
}

export const Route = createFileRoute("/recover-password")({
    component: RecoverPassword,
    beforeLoad: async () => {
        if (isLoggedIn()) {
            throw redirect({
                to: "/",
            })
        }
    },
})

function RecoverPassword() {
  const {
    register,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<FormData>()
  const showToast = useCustomToast()

  const [isOtpSent, setIsOtpSent] = useState(false)
  const [inputOTP, setInputOTP] = useState("")
  const [storedOtp, setStoredOtp] = useState("");
  const [userEmail, setUserEmail] = useState("")
  const navigate = useNavigate();

  function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  const recoverPassword = async (data: FormData) => {
    await LoginService.recoverPassword({
      email: data.email,
    })
  }

  const mutation = useMutation({
    mutationFn: recoverPassword,
    onSuccess: () => {
      showToast(
          "Email sent.",
          "We sent an email with a code to get back into your account.",
          "success",
      )
      reset()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
  })


  const verifyOTP = () => {
    try {
      console.log("Input otp:", inputOTP);
      console.log("Stored otp:", storedOtp);
      if (inputOTP === storedOtp) {
        setIsOtpSent(false)
        setInputOTP("")
        navigate({to: "/reset-password"});
      } else {
        alert("Invalid OTP or Time Out")
        setIsOtpSent(false)
        setInputOTP("")
      }
    } catch {
      // Handle error if OTP verification fails
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setUserEmail(data.email) // Store the email when submitting
    //setValue("email", data.email) // Keep the email in the form
    const otp = generateOTP()
    setStoredOtp(otp)

    await sendOTPNotification(data.email, "User", otp)
    setIsOtpSent(true)
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
          Password Recovery
        </Heading>
        <Text align="center">
          A password recovery email will be sent to the registered account.
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
              isDisabled={isOtpSent} // Disable input after OTP is sent
              value={userEmail} // Persist email value
              onChange={(e) => setUserEmail(e.target.value)} // Update state on change
          />
          {errors.email && (
              <FormErrorMessage>{errors.email.message}</FormErrorMessage>
          )}
        </FormControl>

        {!isOtpSent ? (
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Continue
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