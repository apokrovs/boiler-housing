import {Link as RouterLink, createFileRoute} from "@tanstack/react-router";
import {Center, Container, Heading, VStack, Text, Button, HStack} from "@chakra-ui/react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {UserPublic, UsersService, UserUpdateMe} from "../../client";

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

    const {data: users} = useQuery<UserPublic[]>({
        queryKey: ["users"],
        queryFn: async () => {
            const response = await UsersService.readUsers();
            return response.data; // Extract the array from the response
        },
        initialData: () =>
            queryClient.getQueryData<UserPublic[]>(["users"]) ?? [],
        enabled: !!currentUser?.hasTakenRoommateQuiz
    });

    const updateUserMutation = useMutation({
        mutationFn: (updatedUser: UserUpdateMe) =>
            UsersService.updateUserMe({requestBody: updatedUser}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["currentUser"]})
        },
        onError: (error) => {
            console.error("Failed to update auto logout time.", error)
            alert("Failed to update auto logout time.")
        }
    })


    const handleReset = () => {
        if (currentUser) {
            const updatedUser = {
                ...currentUser,
                hasTakenRoommateQuiz: false,
                cleanScore: null,
                visitScore: null,
                sleepTime: null,
                pets: null,
                smoking: null,
                alcoholScore: null
            }
            updateUserMutation.mutate(updatedUser)
        }
    };

    console.log(!!currentUser?.hasTakenRoommateQuiz);

    if (!currentUser?.hasTakenRoommateQuiz) {
        return (
            <>
                <Container maxW="full">
                    <Center>
                        <VStack>
                            <Heading color={"#CEB888"}>Welcome to Roommates!</Heading>
                            <Text pb={4}>Please complete the roommate matching quiz to use our roommate
                                services.</Text>
                            <Button as={RouterLink} to={'/roommate-quiz'}>Take the quiz</Button>
                        </VStack>
                    </Center>
                </Container>
            </>
        )
    } else {

        function calculateScore(user: UserPublic) {
            // @ts-ignore
            return Math.abs(currentUser?.cleanScore - user?.cleanScore) + Math.abs(currentUser?.visitScore - user?.visitScore) + Math.abs(currentUser?.sleepTime - user?.sleepTime) + Math.abs(currentUser?.alcoholScore - user?.alcoholScore);

        }

        let bestMatches: (UserPublic | null)[] = [null, null, null];
        let bestScores: number[] = [1000, 1000, 1000];
        for (const user of users) {
            if (user?.id === currentUser?.id) {
                continue;
            }
            if (!user?.hasTakenRoommateQuiz) {
                continue;
            }
            if (user?.smoking != currentUser?.smoking || user?.pets != currentUser?.pets) {
                continue;
            }
            const matchScore = calculateScore(user);
            //Replacement is hard coded to avoid looping through all values for every user
            if (matchScore < bestScores[0]) {
                bestMatches[2] = bestMatches[1];
                bestScores[2] = bestScores[1];
                bestMatches[1] = bestMatches[0];
                bestScores[1] = bestScores[0];
                bestMatches[0] = user;
                bestScores[0] = matchScore;
            } else if (matchScore < bestScores[1]) {
                bestMatches[2] = bestMatches[1];
                bestScores[2] = bestScores[1];
                bestMatches[1] = user;
                bestScores[1] = matchScore;
            } else if (matchScore < bestScores[2]) {
                bestMatches[2] = user;
                bestScores[2] = matchScore;
            }
        }
        const bestMatch: string = bestMatches[0]?.email ?? "Not enough matches";
        const secondMatch: string = bestMatches[1]?.email ?? "Not enough matches"
        const thirdMatch: string = bestMatches[2]?.email ?? "Not enough matches"
        return (
            <>
                <Container maxW="full">
                    <Center>
                        <VStack>
                            <Heading color={"#CEB888"}>Welcome to Roommates!</Heading>
                            <Text pb={4}>Feel free to retake your roommate quiz if your preferences change.</Text>
                            <HStack>
                                <Button onClick={handleReset}>Reset my selections</Button>
                                <Button as={RouterLink} to={'/roommate-quiz'}>Take the quiz</Button>
                            </HStack>
                            <Heading pt={4} color={"#CEB888"}>Roommate Suggestions</Heading>
                            <Text pb={4}>Here are your three closest roommate matches.</Text>
                            <Text fontSize={20} pb={2}>1. {bestMatch}</Text>
                            <Text fontSize={20} pb={2}>2. {secondMatch}</Text>
                            <Text pb={6} fontSize={20}>3. {thirdMatch}</Text>
                            <Heading color={"#CEB888"}>Roommate Groups</Heading>
                        </VStack>
                    </Center>
                </Container>
            </>
        )
    }

}