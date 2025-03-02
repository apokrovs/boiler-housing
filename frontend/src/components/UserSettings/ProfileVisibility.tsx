import {useState} from 'react'
import {
    Container,
    Heading,
    Stack,
    FormControl,
    FormLabel,
    Switch,
    Button
} from "@chakra-ui/react"

const ProfileVisibility = () => {
    const [showProfile, setShowProfile] = useState(true)
    const handleUpdateVisibility = () => {
        alert("Visibility settings updated")
    }

    return (
        <Container maxW="md">
            <Heading size="lg" mb={6}>
                Profile Visibility
            </Heading>

            <Stack spacing={4} mb={6}>
                //Profile
                <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="show-name" mb="0">
                        Hide Profile:
                    </FormLabel>
                    <Switch id="show-name" onChange={() => setShowProfile(!showProfile)}/>
                </FormControl>

                <Button colorScheme="blue" onClick={handleUpdateVisibility}>
                    Update Visibility
                </Button>
            </Stack>

            <Heading size="md" mb={4}>
                Current Settings:
            </Heading>
            <p>Name is {showProfile ? 'visible' : 'hidden'}</p>
        </Container>
    )
}
export default ProfileVisibility
