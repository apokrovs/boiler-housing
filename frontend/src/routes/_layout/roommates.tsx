import {Link as RouterLink, createFileRoute} from "@tanstack/react-router";
import {Center, Container, Heading, VStack, Text, Button} from "@chakra-ui/react";

export const Route = createFileRoute("/_layout/roommates")({
    component: RoommatePage
});

function RoommatePage() {
    return (
        <>
            <Container maxW="full">
                <Center>
                    <VStack>
                <Heading>Welcome to Roommates!</Heading>
                    <Text pb = {4} >Please complete the roommate matching quiz to use our roommate services.</Text>
                        <Button as={RouterLink} to={'/roommate-quiz'}>Take the quiz</Button>
                    </VStack>
                </Center>
            </Container>
        </>
    )
}