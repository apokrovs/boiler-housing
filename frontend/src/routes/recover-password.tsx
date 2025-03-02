import {
  Box,
  Button, Center,
  Container,
  FormControl,
  FormErrorMessage,
  Heading, HStack, Image,
  Input, Link,
  Text,
} from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import {createFileRoute, Link as RouterLink, redirect} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type ApiError, LoginService } from "../client"
import { isLoggedIn } from "../hooks/useAuth"
import useCustomToast from "../hooks/useCustomToast"
import { emailPattern, handleError } from "../utils"

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
    formState: { errors, isSubmitting },
  } = useForm<FormData>()
  const showToast = useCustomToast()

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
        "We sent an email with a link to get back into your account.",
        "success",
      )
      reset()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
  })

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    mutation.mutate(data)
  }

  return (
      <>
        <Box
            boxShadow={'md'}
            height={"100px"}
            width={"100%"}>
          <HStack gap={90}>
            <Image pl={4} pt={"15px"} src={"/assets/images/BoilerHousingCropped.png"}></Image>
          </HStack>
        </Box>
    <Container
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      h="75vh"
      maxW="sm"
      alignItems="stretch"
      justifyContent="center"
      gap={4}
      centerContent
    >
      <Heading size="xl" color={"#CEB888"}textAlign="center" mb={2}>
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
        />
        {errors.email && (
          <FormErrorMessage>{errors.email.message}</FormErrorMessage>
        )}
      </FormControl>
      <Button variant="primary" type="submit" isLoading={isSubmitting}>
        Continue
      </Button>
      <Center>
        <Link
            as={RouterLink}
            to={"/login"}
            variant={'underline'}
            color={'#CEB888'}
            fontSize={'md'}>
          Remembered password?
        </Link>
      </Center>
    </Container>
        </>
  )
}
