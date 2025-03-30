import {
    Box, Button,
    Container, Heading, HStack, Input,
    Text, Textarea, VStack,
} from "@chakra-ui/react"
import {createFileRoute} from "@tanstack/react-router"

import useAuth from "../../hooks/useAuth"

export const Route = createFileRoute("/_layout/roommate_agreement")({
  component: Dashboard,
})

function Dashboard() {
  const { user: currentUser } = useAuth()

    return (
        <>
            <Container maxW="full">
                <Box pt={12} m={4}>
                    <VStack align={"flex-start"} padding={10}>
                        <Heading size="lg">Roommate Agreement:</Heading>
                        <Textarea size="lg" placeholder="Roommate Agreement" />
                        <Input marginTop={5} placeholder="Signature" />
                        <Button
                            marginTop={3}
                            bgColor={"#CEB888"}
                            size="md"
                        > Send
                        </Button>
                    </VStack>
                </Box>
            </Container>
        </>
    )
}
