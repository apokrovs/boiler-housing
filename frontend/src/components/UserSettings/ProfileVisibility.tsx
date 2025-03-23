import { useState } from "react"
import {
    Container,
    Heading,
    Stack,
    FormControl,
    FormLabel,
    Switch,
    Button,
    Box,
    Text
} from "@chakra-ui/react"
import useAuth from "../../hooks/useAuth"

const ProfileVisibility = () => {
    const { user: currentUser } = useAuth()
    const [isAnonymous, setIsAnonymous] = useState(false)

    const handleUpdateVisibility = () => {
        alert("Profile visibility updated")
    }

    const getVisibleValue = (value?: string | null, fallback = "Hidden") => {
        if (isAnonymous || !value) return fallback
        return value
    }

    return (
        <Container maxW="md">
            <Heading size="lg" mb={6}>
                Profile Visibility
            </Heading>

            <Stack spacing={4} mb={6}>
                <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="profile-anonymous" mb="0">
                        Make Profile Anonymous
                    </FormLabel>
                    <Switch
                        id="profile-anonymous"
                        isChecked={isAnonymous}
                        onChange={() => setIsAnonymous(!isAnonymous)}
                    />
                </FormControl>

                <Button colorScheme="yellow" onClick={handleUpdateVisibility}>
                    Update Visibility
                </Button>
            </Stack>

            <Heading size="md" mb={4}>
                What Others See:
            </Heading>
            <Box p={4} borderWidth="1px" borderRadius="md">
                <Text><strong>Name:</strong> {getVisibleValue(currentUser?.full_name, "Anonymous")}</Text>
                <Text><strong>Email:</strong> {getVisibleValue(currentUser?.email)}</Text>
            </Box>
        </Container>
    )
}

export default ProfileVisibility
