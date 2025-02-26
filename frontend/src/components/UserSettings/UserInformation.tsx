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
import {Controller, type SubmitHandler, useForm} from "react-hook-form"

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
        control,
        formState: {isSubmitting, errors, isDirty},
    } = useForm<UserPublic>({
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: {
            full_name: currentUser?.full_name,
            email: currentUser?.email,
            phone_number: currentUser?.phone_number,
            bio: currentUser?.bio,
            profile_type: currentUser?.profile_type
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

    const formatPhoneNumber = (phoneNumber: string | null | undefined): string => {
        if (!phoneNumber) return "N/A";

        // Remove all non-numeric characters
        const cleaned = phoneNumber.replace(/\D/g, "");

        // Format the number as (XXX) XXX-XXXX
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }

        return phoneNumber; // Return as-is if it's not a 10-digit number
    };

    const bgActive = useColorModeValue("#f0eee2", "#68634a")

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
                        <FormLabel color={color} htmlFor="phone_number">
                            Phone Number (Optional):
                        </FormLabel>
                        {editMode ? (
                            <Input
                                id="phone_number"
                                placeholder="XXXXXXXXXX"
                                {...register("phone_number", {maxLength: 10})}
                                type="tel"
                                size="md"
                                w="auto"
                            />
                        ) : (
                            <Text
                                size="md"
                                py={2}
                                color={!currentUser?.phone_number ? "#A0AEC0" : "inherit"}
                                isTruncated
                                maxWidth="250px">
                                {formatPhoneNumber(currentUser?.phone_number) || "N/A"}
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
                            {...register("bio", {maxLength: 255})}
                            resize="none"
                            height="150px"
                            w="full"
                        />
                    ) : (
                        <Text
                            height="150px"
                            width="full"
                            color={!currentUser?.bio ? "#A0AEC0" : "inherit"}
                        >
                            {currentUser?.bio || "No bio available."}
                        </Text>
                    )}

                    <FormLabel py={2}>Profile Type:</FormLabel>
                    {editMode ? (
                        <Controller
                            name="profile_type"
                            control={control}
                            defaultValue={currentUser?.profile_type || "Leaser"} // Ensure it's always a string
                            render={({field}) => (
                                <RadioGroup {...field} value={field.value ?? "Leaser"}> {/* Ensure no null */}
                                    <Stack direction="row">
                                        <Radio value="Leaser">Leaser</Radio>
                                        <Radio value="Renter">Renter</Radio>
                                        <Radio value="Both">Both</Radio>
                                    </Stack>
                                </RadioGroup>
                            )}
                        />
                    ) : (
                        <Text
                            color={!currentUser?.profile_type ? "#A0AEC0" : "inherit"}
                        >
                            {currentUser?.profile_type || "No profile specification chosen."}
                        </Text>
                    )}
                    <Flex mt={4} gap={3}>
                        <Button
                            bg={bgActive}
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
