import {Link as RouterLink, createFileRoute} from "@tanstack/react-router";
import {Center, Container, Heading, VStack, Text, Button, Box} from "@chakra-ui/react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {UserPublic, UsersService} from "../../client";

export const Route = createFileRoute("/_layout/roommates")({
    component: RoommatePage
});

function RoommatePage() {
    const queryClient = useQueryClient();


    const {data: currentUser} = useQuery<UserPublic>({
        queryKey: ["currentUser"],
        queryFn: () =>
            UsersService.readUserMe() as unknown as Promise<UserPublic>,
        initialData: () => queryClient.getQueryData<UserPublic>(["currentUser"]),
    });


    if (!currentUser?.hasTakenRoommateQuiz) {
        return (
            <>
                <Container maxW="full">
                    <Center>
                        <VStack>
                            <Heading color={"#CEB888"}>Welcome to Roommates!</Heading>
                            <Text pb={4}>Please complete the roommate matching quiz to use our roommate services.</Text>
                            <Button as={RouterLink} to={'/roommate-quiz'}>Take the quiz</Button>
                        </VStack>
                    </Center>
                </Container>
            </>
        )
    } else {
        return (
            <>
                <Container maxW="full">
                    <Center>
                        <VStack>
                            <Heading color={"#CEB888"}>Welcome to Roommates!</Heading>
                            <Text pb={4}>Feel free to retake your roommate quiz if your preferences change.</Text>
                            <Button as={RouterLink} to={'/roommate-quiz'}>Take the quiz</Button>
                            <Heading color={"#CEB888"}>Roommate Suggestions</Heading>
                            <Text pb={4}>Here are your three closest roommate matches.</Text>
                            <Box h={'200px'}></Box>
                            <Heading color={"#CEB888"}>Roommate Groups</Heading>
                        </VStack>
                    </Center>
                </Container>
            </>
        )
    }

}