import {
    Box,
    Container, Heading, Stack,
    Text,
    Textarea,
    Input,
    Button,
} from "@chakra-ui/react"
import {createFileRoute} from "@tanstack/react-router"

import useAuth from "../../hooks/useAuth"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function Dashboard() {
  const { user: currentUser } = useAuth()

    return (
        <>
            <Container maxW="full">
                <Stack>
                    <Box pt={12} m={4}>
                        <Text fontSize="2xl">
                            Hi, {currentUser?.full_name || currentUser?.email} 👋🏼
                        </Text>
                        <Text>Welcome back, nice to see you again!</Text>
                    </Box>
                    <Box>
                        <Heading size={"md"}>Roommate Agreement</Heading>
                        <Textarea mt={5} size={"md"} placeholder={"Roommate Agreement"}></Textarea>
                        <Input mt={8} placeholder="Signature" size="md"/>
                        <Button mt={3}>Submit</Button>
                    </Box>
                </Stack>
            </Container>
        </>
    )
}
