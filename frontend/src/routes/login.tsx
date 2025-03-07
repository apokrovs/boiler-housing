//import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons"
import {
    Box,
    Button,
    //Container,
    FormControl,
    //FormErrorMessage,
    Heading,
    HStack,
    //Icon,
    Image,
    Input,
    Link,
    Text,
    Stack,
    Center,
    Alert,
    AlertIcon, FormErrorMessage,
    Radio, RadioGroup
    //useBoolean
} from "@chakra-ui/react"
import {
    Link as RouterLink,
    createFileRoute,
    redirect,
} from "@tanstack/react-router"
import {type SubmitHandler, useForm} from "react-hook-form"

//const Logo = "/assets/images/BoilerHousingCropped.png"
import {
    Body_login_login_access_token as AccessToken,
    UsersService,
} from "../client"
import useAuth, {isLoggedIn, PinLogin} from "../hooks/useAuth"
import {emailPattern} from "../utils"
import {useState} from "react";
import {sendOTPNotification} from "../client/emailService.ts";

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
    const {loginMutation, loginWithPinMutation, error, resetError} = useAuth()

    const [isOtpSent, setIsOtpSent] = useState(false)
    const [inputOTP, setInputOTP] = useState("")

    const [storedOtp, setStoredOtp] = useState("");
    let futureTime = new Date(Date.now() + 10 * 60 * 1000)

    function generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Define a type that includes all possible fields
    type LoginFormData = {
        username: string;
        password: string;
        pin?: string;
    }

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
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
            console.log("Current Time:", Date.now());
            console.log("Future Time:", futureTime.getTime());
            console.log("Input otp:", inputOTP);
            console.log("Stored otp:", storedOtp);
            if ((inputOTP === storedOtp) && (Date.now() <= futureTime.getTime())) {
                if (loginMethod === 'password') {
                    // Use only username and password fields for password login
                    const passwordData: AccessToken = {
                        username: data.username,
                        password: data.password
                    }
                    await loginMutation.mutateAsync(passwordData)
                } else {
                    // For PIN login, transform data to PinLogin format
                    const pinData: PinLogin = {
                        email: data.username,  // Use username field for email
                        pin: data.password || ""    // Use pin field for PIN
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
        } catch {
            // Handle error if OTP verification fails
        }
    };

    const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
        if (isSubmitting) return

        resetError()

        const loginUser = await UsersService.readUserByEmail({email: data.username});

        try {
            if (loginUser.is_2fa_enabled) {
                const otp = generateOTP(); // Generate OTP and store it in a variable
                setStoredOtp(otp); // Update state with the OTP
                console.log("Generated OTP:", otp); // Log the correct OTP

                await sendOTPNotification(
                    data.username,
                    "User",
                    otp
                );

                futureTime = new Date(Date.now() + 10 * 60 * 1000);
                setIsOtpSent(true);
                return; // Prevent normal login from executing until OTP is verified
            } else {
                if (loginMethod === 'password') {
                    // Use only username and password fields for password login
                    const passwordData: AccessToken = {
                        username: data.username,
                        password: data.password
                    }
                    await loginMutation.mutateAsync(passwordData)
                } else {
                    // For PIN login, transform data to PinLogin format
                    const pinData: PinLogin = {
                        email: data.username,  // Use username field for email
                        pin: data.password || ""    // Use pin field for PIN
                    }
                    await loginWithPinMutation.mutateAsync(pinData)
                }
            }
        } catch {
            // error is handled by useAuth hook
        }
    }

    return (
        <>
            <Box
                boxShadow={'md'}
                height={"100px"}
                //background={"black"}
                width={"100%"}>
                <HStack gap={90}>
                    <Image pl={4} pt={"15px"} src={"/assets/images/BoilerHousingCropped.png"}></Image>
                </HStack>
            </Box>
            <Center p={12} //bg={'white'}
            >
                <Stack
                    as={"form"}
                    onSubmit={isOtpSent ? handleSubmit(handleOtpSubmit) : handleSubmit(onSubmit)}
                    rounded={'lg'}
                    boxShadow={'lg'}
                    //bg={"white"}
                    p={20}
                    gap={6}>
                    <Heading
                        fontSize={"3xl"}
                        color={"#CEB888"}
                    >
                        Welcome Back!
                    </Heading>
                    <Text fontSize={"md"}>
                        {isOtpSent
                            ? "Enter the OTP sent to your email."
                            : `Please log in with your email and ${loginMethod === "password" ? "password" : "PIN"}.`}
                    </Text>

                    {error && (
                        <Alert status="error">
                            <AlertIcon/>
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
                            disabled={isOtpSent} // Disable input after sending OTP
                        >
                        </Input>
                        {errors.username && (
                            <FormErrorMessage>{errors.username.message}</FormErrorMessage>
                        )}
                    </FormControl>
                    {!isOtpSent ? (
                        <>
                            {loginMethod === "password" && (
                                <FormControl id={"password"} isInvalid={!!error}>
                                    <Input
                                        {...register("password", {required: "Password is required"})}
                                        placeholder={"Password"}
                                        type={"password"}
                                    />
                                </FormControl>
                            )}

                            {loginMethod === "pin" && (
                                <FormControl id={"pin"} isInvalid={!!error}>
                                    <Input
                                        {...register("password", {required: "PIN is required"})}
                                        placeholder={"PIN"}
                                        type={"password"}
                                        maxLength={4}
                                    />
                                </FormControl>
                            )}
                        </>
                    ) : (
                        // OTP Input when OTP is Sent
                        <FormControl id="otp">
                            <Input
                                value={inputOTP}
                                placeholder="Enter OTP"
                                type="password"
                                maxLength={6} // Typical OTP length
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
                            <Link as={RouterLink} to={"/signup"} variant={'underline'} color={'#CEB888'}
                                  fontSize={'md'}>
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
    );
}