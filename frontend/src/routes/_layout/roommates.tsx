import {Link as RouterLink, createFileRoute} from "@tanstack/react-router";
import {Center, Container, Heading, VStack, Text, Button, HStack, List, ListItem} from "@chakra-ui/react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    ConversationPublic,
    MessagesService,
    UserPublic,
    UsersService,
    UserUpdateMe
} from "../../client";
import {NewConversation} from "../../components/Chat/NewConversation"
import useCustomToast from "../../hooks/useCustomToast.ts";

export const Route = createFileRoute("/_layout/roommates")({
    component: RoommatePage
});

function RoommatePage() {
    const queryClient = useQueryClient();
    const showToast = useCustomToast();

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
            return response.data;
        },
        initialData: () =>
            queryClient.getQueryData<UserPublic[]>(["users"]) ?? [],
        enabled: true
    });

const { data: conversations } = useQuery<ConversationPublic[]>({
  queryKey: ["conversations"],
  queryFn: async () => {
    const response = await MessagesService.getConversations();
    return response.data;
  },
});
const groupchats = conversations?.filter(conv => conv.is_group && conv.name) ?? [];




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

    const handleCreateRoommateGroup = (conversationId: string, isGroup: boolean, name?: string) => {
        queryClient.invalidateQueries({queryKey: ["conversations"]});
        showToast("Success!", "Roommate group successfully created", "success");
    }

    console.log(!!currentUser?.hasTakenRoommateQuiz);

    if (!currentUser?.hasTakenRoommateQuiz) {
        return (
            <>
                <Container maxW="full">
                    <Center>
                        <VStack>
                            <Heading color={"#CEB888"}>Welcome to Roommates!</Heading>
                            <Text pb={4}>Please complete the roommate matching quiz to use our roommate
                                matching services.</Text>
                            <Button size={'lg'} as={RouterLink} to={'/roommate-quiz'}>Take the quiz</Button>
                            <Heading color={"#CEB888"}>Roommate Groups</Heading>
                            <List as="ol">
                                {groupchats.map((groupchat) => (
                                    <ListItem key={groupchat.id} fontSize="lg">
                                        <Text fontWeight="bold">{groupchat.name}</Text>
                                        <List pl={4} mt={2}>
                                            {groupchat.participants?.map((participant) => {
                                                const user = users.find((u) => u.id === participant.user_id);
                                                return (
                                                    <ListItem key={participant.user_id}>
                                                        {user ? user.full_name ? user.full_name + " - " + user.email : user.email : participant.user_id}
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    </ListItem>
                                ))}
                            </List>
                            {/*<Button onClick={handleOpenNewConversation}>Create a Roommate Group</Button>*/}
                            <NewConversation onNewConversation={handleCreateRoommateGroup} buttonColor={"ui.main"}
                                             setGroup={true} buttonSize={"lg"} buttonWidth={""}
                                             buttonText={"Create a roommate group"}></NewConversation>
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
                            <Text pb={4}>Feel free to reset your selections if your preferences change.</Text>
                            <HStack>
                                <Button onClick={handleReset}>Reset my selections</Button>
                            </HStack>
                            <HStack spacing={16} align={"baseline"}>
                                <VStack>
                                    <Heading pt={6} color={"#CEB888"}>Roommate Suggestions</Heading>
                                    <Text pb={4}>Here are your three closest roommate matches.</Text>
                                    <Text fontSize={20} pb={2}>1. {bestMatch}</Text>
                                    <Text fontSize={20} pb={2}>2. {secondMatch}</Text>
                                    <Text pb={6} fontSize={20}>3. {thirdMatch}</Text>
                                </VStack>
                                <VStack>
                                    <Heading color={"#CEB888"}>Roommate Groups</Heading>
                                    <List as="ol">
                                        {groupchats.map((groupchat) => (
                                            <ListItem key={groupchat.id} fontSize="lg">
                                                <Text fontWeight="bold">{groupchat.name}</Text>
                                                <List pl={4} mt={2}>
                                                    {groupchat.participants?.map((participant) => {
                                                        const user = users.find((u) => u.id === participant.user_id);
                                                        return (
                                                            <ListItem key={participant.user_id}>
                                                                {user ? user.full_name ? user.full_name + " - " + user.email : user.email : participant.user_id}
                                                            </ListItem>
                                                        );
                                                    })}
                                                </List>
                                            </ListItem>
                                        ))}
                                    </List>

                                    <NewConversation onNewConversation={handleCreateRoommateGroup}
                                                     buttonColor={"ui.main"}
                                                     setGroup={true} buttonSize={"lg"} buttonWidth={""}
                                                     buttonText={"Create a roommate group"}></NewConversation>

                                </VStack>
                            </HStack>
                        </VStack>
                    </Center>
                </Container>
            </>
        )
    }

}