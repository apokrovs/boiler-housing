import {
    //Box,
    Button,
    Container,
    Flex,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Heading,
    Input, Radio,
    RadioGroup, Stack,
    Text, Textarea,
    useColorModeValue,
} from "@chakra-ui/react"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {useState} from "react"
import {type SubmitHandler, useForm} from "react-hook-form"

import {
    type ApiError,
    type UserPublic,
    type UserUpdateMe,
    UsersService,
} from "../../client"
import useAuth from "../../hooks/useAuth"
import useCustomToast from "../../hooks/useCustomToast"
import {emailPattern, handleError} from "../../utils"

const UserInformation = () => {
    const queryClient = useQueryClient()
    const color = useColorModeValue("inherit", "ui.light")
    const showToast = useCustomToast()
    const [editMode, setEditMode] = useState(false)
    const {user: currentUser} = useAuth()
    const {
        register,
        handleSubmit,
        reset,
        getValues,
        formState: {isSubmitting, errors, isDirty},
    } = useForm<UserPublic>({
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: {
            full_name: currentUser?.full_name,
            email: currentUser?.email,
            //TODO Need to update w phone#, bio, and profile type (renter/leaser)
        },
    })

    const toggleEditMode = () => {
        setEditMode(!editMode)
    }

    const mutation = useMutation({
        mutationFn: (data: UserUpdateMe) =>
            UsersService.updateUserMe({requestBody: data}),
        onSuccess: () => {
            showToast("Success!", "User updated successfully.", "success")
        },
        onError: (err: ApiError) => {
            handleError(err, showToast)
        },
        onSettled: () => {
            queryClient.invalidateQueries()
        },
    })

    const onSubmit: SubmitHandler<UserUpdateMe> = async (data) => {
        mutation.mutate(data)
    }

    const onCancel = () => {
        reset()
        toggleEditMode()
    }

    return (
        <>
            <Container maxW="md" mt={8}>
                <Heading size="lg" mb={6}>
                    User Information
                </Heading>
                <Stack spacing={4} mb={6}
                       as="form"
                       onSubmit={handleSubmit(onSubmit)}
                >
                    <FormControl>
                        <FormLabel color={color} htmlFor="name">
                            Full Name:
                        </FormLabel>
                        {editMode ? (
                            <Input
                                id="name"
                                {...register("full_name", {maxLength: 30})}
                                placeholder="First and Last Name"
                                type="text"
                                size="md"
                                w="auto"
                            />
                        ) : (
                            <Text
                                size="md"
                                py={2}
                                color={!currentUser?.full_name ? "#A0AEC0" : "inherit"}
                                isTruncated
                                maxWidth="250px"
                            >
                                {currentUser?.full_name || "N/A"}
                            </Text>
                        )}
                    </FormControl>
                    <FormControl mt={4} isInvalid={!!errors.email}>
                        <FormLabel color={color} htmlFor="email">
                            Email:
                        </FormLabel>
                        {editMode ? (
                            <Input
                                id="email"
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: emailPattern,
                                })}
                                placeholder="email@example.com"
                                type="email"
                                size="md"
                                w="auto"
                            />
                        ) : (
                            <Text size="md" py={2} isTruncated maxWidth="250px">
                                {currentUser?.email}
                            </Text>
                        )}
                        {errors.email && (
                            <FormErrorMessage>{errors.email.message}</FormErrorMessage>
                        )}
                    </FormControl>
                    <FormControl mt={4}>
                        <FormLabel color={color} htmlFor="phone">
                            Phone Number (Optional):
                        </FormLabel>
                        {editMode ? (
                            <Input
                                id="phone"
                                placeholder="(XXX) XXX-XXXX"
                                type="tel"
                                size="md"
                                w="auto"
                            />
                        ) : (
                            <Text size="md" py={2} color="#A0AEC0" isTruncated
                                  maxWidth="250px">
                                N/A
                            </Text>
                        )}
                    </FormControl>
                    <Heading size="sm" py={2}>
                        Bio:
                    </Heading>
                    {editMode ? (
                        <Textarea
                            id="bio"
                            placeholder="Tell us about yourself..."
                            resize="none"
                            height="150px"
                            w="full"
                        />
                    ) : (
                        <Text height="150px" width="full" color="#A0AEC0">
                            No bio available.
                        </Text>
                    )}
                    <FormLabel py={2}>Profile Type:</FormLabel>
                    <RadioGroup defaultValue="renter">
                        <Stack direction="row">
                            <Radio value="leaser">Leaser</Radio>
                            <Radio value="renter">Renter</Radio>
                            <Radio value="both">Both</Radio>
                        </Stack>
                    </RadioGroup>
                    <Flex mt={4} gap={3}>
                        <Button
                            bg="#68634a"
                            _hover={{bg: "#5a5640"}}
                            _active={{bg: "#4e4a38"}}
                            variant="solid"
                            onClick={toggleEditMode}
                            type={editMode ? "button" : "submit"}
                            isLoading={editMode ? isSubmitting : false}
                            isDisabled={editMode ? !isDirty || !getValues("email") : false}
                        >
                            {editMode ? "Save" : "Edit"}
                        </Button>
                        {editMode && (
                            <Button onClick={onCancel} isDisabled={isSubmitting}>
                                Cancel
                            </Button>
                        )}
                    </Flex>
                </Stack>
            </Container>
        </>
    )
}

export default UserInformation
