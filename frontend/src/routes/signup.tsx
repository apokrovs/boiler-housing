console.log(isLoggedIn())
import {
  Box,
  Button,
  Stack,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel, HStack,
  Image,
  Input,
  Link,
  Text, Heading,
} from "@chakra-ui/react"
import {
  Link as RouterLink,
  createFileRoute,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"

const Logo = "/assets/images/BoilerHousingCropped.png"
import type { UserRegister } from "../client"
import useAuth, { isLoggedIn } from "../hooks/useAuth"
import { confirmPasswordRules, emailPattern, passwordRules, phonePattern } from "../utils"

export const Route = createFileRoute("/signup")({
  component: SignUp,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

interface UserRegisterForm extends UserRegister {
  email: string
  phone_number: string | null
  password: string
  confirm_password: string
  full_name?: string | null
  auto_logout?: number
}

function SignUp() {
  const { signUpMutation } = useAuth()
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UserRegisterForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      full_name: "",
      phone_number: "",
      password: "",
      confirm_password: "",
      auto_logout: 30
    },
  })

  const onSubmit: SubmitHandler<UserRegisterForm> = (data) => {
    signUpMutation.mutate(data)
  }

  return (
    <>
        <Box
            boxShadow={'md'}
            height={"100px"}
            //background={"black"}
            width={"100%"}>
          <HStack gap={90}>
            <Image pl={4} pt={"15px"} src={Logo}></Image>
          </HStack>
        </Box>
        <Center p={6} //bg={'white'}
        >
        <Stack
            as={"form"}
            onSubmit = {handleSubmit(onSubmit)}
            rounded={'lg'}
            boxShadow={'lg'}
            //bg={"white"}
            p={20}
            gap={5}
        >
          <Heading
                fontSize={"3xl"}
                color={"#CEB888"}
          >
              Let's get to know you!
          </Heading>
          <Text
                //color={"#373A36"}
                fontSize={"md"}>
              Please enter your information below.
          </Text>
          <FormControl id="full_name" isInvalid={!!errors.full_name}>
            <FormLabel htmlFor="full_name" srOnly>
              Full Name
            </FormLabel>
            <Input
              id="full_name"
              minLength={3}
              {...register("full_name", { required: "Full Name is required" })}
              placeholder="Full Name"
              type="text"
            />
            {errors.full_name && (
              <FormErrorMessage>{errors.full_name.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="email" isInvalid={!!errors.email}>
            <FormLabel htmlFor="email" srOnly>
              Email
            </FormLabel>
            <Input
              id="email"
              {...register("email", {
                required: "Email is required",
                pattern: emailPattern,
              })}
              placeholder="Email"
              type="email"
            />
            {errors.email && (
              <FormErrorMessage>{errors.email.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl id={"phone_number"} isInvalid={!!errors.phone_number}>
            <FormLabel htmlFor="phone_number" srOnly>
              Phone Number
            </FormLabel>
            <Input
                id={"phone_number"}
                placeholder="Phone XXXXXXXXXX"
              {...register("phone_number", {
                pattern: phonePattern
              })}>
            </Input>
            {errors.phone_number && (
              <FormErrorMessage>{errors.phone_number.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="password" isInvalid={!!errors.password}>
            <FormLabel htmlFor="password" srOnly>
              Password
            </FormLabel>
            <Input
              id={"password"}
              {...register("password", passwordRules())}
              placeholder={"Password"}
              type={"password"}
            />
            {errors.password && (
              <FormErrorMessage>{errors.password.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl
            id={"confirm_password"}
            isInvalid={!!errors.confirm_password}
          >
            <FormLabel htmlFor="confirm_password" srOnly>
              Confirm Password
            </FormLabel>

            <Input
              id={"confirm_password"}
              {...register("confirm_password", confirmPasswordRules(getValues))}
              placeholder={"Repeat Password"}
              type={"password"}
            />
            {errors.confirm_password && (
              <FormErrorMessage>
                {errors.confirm_password.message}
              </FormErrorMessage>
            )}
          </FormControl>
          <Button
              //variant="primary"
              type={"submit"}
              isLoading={isSubmitting}
              //bg={"black"}
              loadingText={"Signing you up..."}
              width={"100%"}
              size={'lg'}
              color={'#CEB888'}>
            Sign Up
          </Button>
          <Text>
            Already have an account?{" "}
            <Link
                as={RouterLink}
                to={"/login"}
                color={"#CEB888"}>
              Log In
            </Link>
          </Text>
        </Stack>
      </Center>
    </>
  )
}

export default SignUp
