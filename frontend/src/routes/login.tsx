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
  AlertIcon, FormErrorMessage
  //useBoolean
} from "@chakra-ui/react"
import {
  Link as RouterLink,
  createFileRoute,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"

//const Logo = "/assets/images/BoilerHousingCropped.png"
import type { Body_login_login_access_token as AccessToken } from "../client"
import useAuth, { isLoggedIn } from "../hooks/useAuth"
import { emailPattern } from "../utils"

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
  //const [show, setShow] = useBoolean()
  const { loginMutation, error, resetError } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccessToken>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit: SubmitHandler<AccessToken> = async (data) => {
    if (isSubmitting) return

    resetError()

    try {
      await loginMutation.mutateAsync(data)
      //throw redirect({to: "/settings"})
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
              as = {"form"}
              onSubmit = {handleSubmit(onSubmit)}
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
            <Text
                //color={"#373A36"}
                fontSize={"md"}>
              Please log in with your email and password.
            </Text>
            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
            </Alert>
          )}
            <FormControl id = {"username"} isInvalid={!!errors.username || !!error}>
            <Input
                {...register("username", {
                  required: "Username is required",
                  pattern: emailPattern,
                })}
                placeholder={"Email"}
                type={"email"}
                id={"username"}
                >
            </Input>
              {errors.username && (
                <FormErrorMessage>{errors.username.message}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl id={"password"} isInvalid = {!!error}>
            <Input
                {...register("password", {required: "Password is required"})}
                placeholder={"Password"}
                type={"password"}>
              </Input>
            </FormControl>
            <HStack gap={19}>
              <Link
                  as={RouterLink}
                  to={"/recover-password"}
                  color={'#CEB888'} fontSize={'md'}>
                Forgot Password?
              </Link>
              <Button
                  type={"submit"}
                  //bg={"black"}
                  loadingText={"Logging you in..."}
                  isLoading={isSubmitting}
                  width={"50%"}
                  size={'lg'}
                  color={'#CEB888'}>Log In</Button>
            </HStack>
            <HStack>
              <Text
                  //color={"#373A36"}
                  fontSize={"md"}>
                New here?
              </Text>
              <Link
                  as={RouterLink}
                  to={"/signup"}
                  variant={'underline'}
                  color={'#CEB888'}
                  fontSize={'md'}>
                Create an account
              </Link>
            </HStack>
          </Stack>
        </Center>
      </>
  );
}
