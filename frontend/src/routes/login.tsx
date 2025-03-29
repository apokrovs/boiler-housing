import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    Heading,
    HStack,
    Image,
    Input,
    InputGroup,
    InputRightElement,
    Link,
    Text,
    Stack,
    Center,
    Alert,
    AlertIcon,
    Radio,
    RadioGroup,
} from "@chakra-ui/react"
import {
    Link as RouterLink,
    createFileRoute,
    redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useState } from "react"

import {
    Body_login_login_access_token as AccessToken,
    UsersService,
} from "../client"
import useAuth, { isLoggedIn, PinLogin } from "../hooks/useAuth"
import { emailPattern } from "../utils"
import { sendOTPNotification } from "../client/emailService.ts"

export const Route = createFileRoute("/login")({
    component: Login,
    beforeLoad: async () => {
        if (isLoggedIn()) {
            throw redirect({
                to: "/",
            })
        }
    },
})

function Login() {
    const [loginMethod, setLoginMethod] = useState<'password' | 'pin'>('password')
    const { loginMutation, loginWithPinMutation, error, resetError } = useAuth()
    const [isOtpSent, setIsOtpSent] = useState(false)
    const [inputOTP, setInputOTP] = useState("")
    const [storedOtp, setStoredOtp] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showPin, setShowPin] = useState(false)
    let futureTime = new Date(Date.now() + 10 * 60 * 1000)

    function generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString()
    }

    type LoginFormData = {
        username: string
        password: string
        pin?: string
    }

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: {
            username: "",
            password: "",
            pin: "",
        },
    })

    const handleOtpSubmit: SubmitHandler<LoginFormData> = async (data) => {
        try {
            if ((inputOTP === storedOtp) && (Date.now() <= futureTime.getTime())) {
                if (loginMethod === 'password') {
                    const passwordData: AccessToken = {
                        username: data.username,
                        password: data.password
                    }
                    await loginMutation.mutateAsync(passwordData)
                } else {
                    const pinData: PinLogin = {
                        email: data.username,
                        pin: data.password || ""
                    }
                    await loginWithPinMutation.mutateAsync(pinData)
                }
                setIsOtpSent(false)
                setInputOTP("")
            } else {
                alert("Invalid OTP or Time Out")
                setIsOtpSent(false)
                setInputOTP("")
            }
        } catch { }
    };

    const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
        if (isSubmitting) return
        resetError()

        try {
            const loginUser = await UsersService.readUserByEmail({ email: data.username });
            if (loginUser.is_2fa_enabled) {
                const otp = generateOTP()
                setStoredOtp(otp)
                await sendOTPNotification(data.username, "User", otp)
                futureTime = new Date(Date.now() + 10 * 60 * 1000)
                setIsOtpSent(true)
                return
            } else {
                if (loginMethod === 'password') {
                    const passwordData: AccessToken = {
                        username: data.username,
                        password: data.password
                    }
                    await loginMutation.mutateAsync(passwordData)
                } else {
                    const pinData: PinLogin = {
                        email: data.username,
                        pin: data.password || ""
                    }
                    await loginWithPinMutation.mutateAsync(pinData)
                }
            }
        } catch { }
    }

    return (
        <>
            <Box boxShadow={'md'} height={"100px"} width={"100%"}>
                <HStack gap={90}>
                    <Image pl={4} pt={"15px"} src={"/assets/images/BoilerHousingCropped.png"}></Image>
                </HStack>
            </Box>
            <Center p={12}>
                <Stack
                    as={"form"}
                    onSubmit={isOtpSent ? handleSubmit(handleOtpSubmit) : handleSubmit(onSubmit)}
                    rounded={'lg'}
                    boxShadow={'lg'}
                    p={20}
                    gap={6}
                >
                    <Heading fontSize={"3xl"} color={"#CEB888"}>
                        Welcome Back!
                    </Heading>
                    <Text fontSize={"md"}>
                        {isOtpSent
                            ? "Enter the OTP sent to your email."
                            : `Please log in with your email and ${loginMethod === "password" ? "password" : "PIN"}.`}
                    </Text>

                    {error && (
                        <Alert status="error">
                            <AlertIcon />
                            {error}
                        </Alert>
                    )}

                    <FormControl id={"username"} isInvalid={!!errors.username || !!error}>
                        <Input
                            {...register("username", {
                                required: "Username is required",
                                pattern: emailPattern,
                            })}
                            placeholder={"Email"}
                            type={"email"}
                            id={"username"}
                            disabled={isOtpSent}
                        />
                        {errors.username && (
                            <FormErrorMessage>{errors.username.message}</FormErrorMessage>
                        )}
                    </FormControl>

                    {!isOtpSent ? (
                        <>
                            {loginMethod === "password" && (
                                <FormControl id={"password"} isInvalid={!!error}>
                                    <InputGroup>
                                        <Input
                                            {...register("password", { required: "Password is required" })}
                                            placeholder={"Password"}
                                            type={showPassword ? "text" : "password"}
                                        />
                                        <InputRightElement width="4.5rem">
                                            <Button h="1.75rem" size="sm" onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword ? "Hide" : "Show"}
                                            </Button>
                                        </InputRightElement>
                                    </InputGroup>
                                </FormControl>
                            )}

                            {loginMethod === "pin" && (
                                <FormControl id={"pin"} isInvalid={!!error}>
                                    <InputGroup>
                                        <Input
                                            {...register("password", { required: "PIN is required" })}
                                            placeholder={"PIN"}
                                            type={showPin ? "text" : "password"}
                                            maxLength={4}
                                        />
                                        <InputRightElement width="4.5rem">
                                            <Button h="1.75rem" size="sm" onClick={() => setShowPin(!showPin)}>
                                                {showPin ? "Hide" : "Show"}
                                            </Button>
                                        </InputRightElement>
                                    </InputGroup>
                                </FormControl>
                            )}
                        </>
                    ) : (
                        <FormControl id="otp">
                            <Input
                                value={inputOTP}
                                placeholder="Enter OTP"
                                type="password"
                                maxLength={6}
                                onChange={(e) => setInputOTP(e.target.value)}
                            />
                        </FormControl>
                    )}

                    <HStack gap={19}>
                        {!isOtpSent ? (
                            <>
                                <Link as={RouterLink} to={"/recover-password"} color={'#CEB888'} fontSize={'md'}>
                                    Forgot Password?
                                </Link>
                                <Button
                                    type={"submit"}
                                    loadingText={"Logging you in..."}
                                    isLoading={isSubmitting}
                                    width={"50%"}
                                    size={'lg'}
                                    color={'#CEB888'}
                                >
                                    {loginMethod === "password" || loginMethod === "pin" ? "Log In" : "Send OTP"}
                                </Button>
                            </>
                        ) : (
                            <Button
                                type={"submit"}
                                isLoading={isSubmitting}
                                width={"100%"}
                                size={'lg'}
                                color={'#CEB888'}
                            >
                                Verify OTP
                            </Button>
                        )}
                    </HStack>

                    {!isOtpSent && (
                        <HStack>
                            <Text fontSize={"md"}>New here?</Text>
                            <Link as={RouterLink} to={"/signup"} variant={'underline'} color={'#CEB888'} fontSize={'md'}>
                                Create an account
                            </Link>
                        </HStack>
                    )}

                    {!isOtpSent && (
                        <FormControl>
                            <RadioGroup
                                value={loginMethod}
                                onChange={(value) => setLoginMethod(value as "password" | "pin")}
                                display="flex"
                                flexDirection="row"
                                justifyContent="space-evenly"
                            >
                                <Radio value="password" colorScheme="teal">Password</Radio>
                                <Radio value="pin" colorScheme="teal">PIN</Radio>
                            </RadioGroup>
                        </FormControl>
                    )}
                </Stack>
            </Center>
        </>
    )
}
