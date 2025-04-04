import { useState } from 'react'
import {
    Container,
    Heading,
    Stack,
    FormControl,
    FormLabel,
    Switch,
    Button
} from "@chakra-ui/react"
import ProfileTutorial from './ProfileTutorial'

const ProfileVisibility = () => {
    const [showName, setShowName] = useState(true)
    const [showEmail, setShowEmail] = useState(true)
    const [showPhone, setShowPhone] = useState(true)
    const [showBio, setShowBio] = useState(true)

    const handleUpdateVisibility = () => {
        alert("Visibility settings updated")
    }

    return (
        <Container maxW="md" position="relative">

            <Heading size="lg" mb={6}>Profile Visibility</Heading>

            <Stack spacing={4} mb={6} position="relative">

                <FormControl id="tutorial-anchor-name" display="flex" alignItems="center">
                    <FormLabel htmlFor="show-name" mb="0">Hide Name:</FormLabel>
                    <Switch id="show-name" onChange={() => setShowName(!showName)} />
                </FormControl>

                <FormControl id="tutorial-anchor-email" display="flex" alignItems="center">
                    <FormLabel htmlFor="show-email" mb="0">Hide Email:</FormLabel>
                    <Switch id="show-email" onChange={() => setShowEmail(!showEmail)} />
                </FormControl>

                <FormControl id="tutorial-anchor-phone" display="flex" alignItems="center">
                    <FormLabel htmlFor="show-phone" mb="0">Hide Phone Number:</FormLabel>
                    <Switch id="show-phone" onChange={() => setShowPhone(!showPhone)} />
                </FormControl>

                <FormControl id="tutorial-anchor-bio" display="flex" alignItems="center">
                    <FormLabel htmlFor="show-bio" mb="0">Hide Bio:</FormLabel>
                    <Switch id="show-bio" onChange={() => setShowBio(!showBio)} />
                </FormControl>

                <div id="tutorial-anchor-button" />
                <Button colorScheme="yellow" onClick={handleUpdateVisibility}>
                    Update Visibility
                </Button>
            </Stack>

            <Heading size="md" mb={4}>Current Settings:</Heading>
            <p>Name is {showName ? 'visible' : 'hidden'}</p>
            <p>Email is {showEmail ? 'visible' : 'hidden'}</p>
            <p>Phone is {showPhone ? 'visible' : 'hidden'}</p>
            <p>Bio is {showBio ? 'visible' : 'hidden'}</p>

            <ProfileTutorial />
        </Container>
    )
}

export default ProfileVisibility
