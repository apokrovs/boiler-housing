import {createFileRoute} from "@tanstack/react-router";
import {
    Center,
    Container,
    Heading,
    VStack,
    Text,
    Textarea,
    Button,
    Input,
    Box,
    Flex, useToast,
} from "@chakra-ui/react";
import {useQuery} from "@tanstack/react-query";
import {
    ConversationPublic,
    MessagesService,
} from "../../client";
import useCustomToast from "../../hooks/useCustomToast.ts";
import {useState, useEffect} from "react";
import {
    sendChatMessage,
    createWebSocketConnection,
    subscribeToMessageType, closeWebSocketConnection,
} from "../../components/Chat/websocket";
import useAuth from "../../hooks/useAuth.ts";

export const Route = createFileRoute("/_layout/roommate_agreement")({
    component: RoommateAgreement
});

function RoommateAgreement() {
    const showToast = useCustomToast();
    const [agreementText, setAgreementText] = useState('');
    const [signature, setSignature] = useState('');

    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const {user} = useAuth();
    const toast = useToast();

    // Connect to WebSocket when component mounts
    useEffect(() => {
        if (!user) return;

        // Create WebSocket connection
        createWebSocketConnection();

        // Set up subscription for connection status
        const unsubscribeOpen = subscribeToMessageType('connection_open', () => {
            setIsConnected(true);
            setError(null);
            // toast({
            //     title: 'Connected to chat',
            //     status: 'success',
            //     duration: 2000,
            //     isClosable: true,
            //     position: 'bottom-right',
            // });
        });

        // Subscribe to connection close events
        const unsubscribeClose = subscribeToMessageType('connection_close', (data) => {
            setIsConnected(false);

            // Only show error for abnormal closures
            if (data.code !== 1000 && data.code !== 1008) {
                setError('Connection lost. Please refresh the page to reconnect.');
            }
        });

        // Subscribe to error events
        const unsubscribeError = subscribeToMessageType('connection_error', () => {
            setError('WebSocket error occurred');
        });

        // Clean up on unmount
        return () => {
            closeWebSocketConnection();
            unsubscribeOpen();
            unsubscribeClose();
            unsubscribeError();
        };
    }, [user, toast]);


    const { data: conversations } = useQuery<ConversationPublic[]>({
      queryKey: ["conversations"],
      queryFn: async () => {
        const response = await MessagesService.getConversations();
        return response.data;
      },
    });
    const groupchats = conversations?.filter(conv => conv.is_group && conv.name) ?? [];

    const formatAgreementMessage = (agreement: string, signature: string) => {
        //const date = new Date().toLocaleDateString();
        return `****ROOMMATE AGREEMENT****\n\n${agreement}\n\n**Signed:**\n${signature}`;
    };

    const sendAgreementToConversation = (conversationId: string, message: string) => {
        if (!isConnected) {
            showToast("Connection Error", "Unable to connect to chat server. Please try again in a moment.", "error");
            return;
        }

        const success = sendChatMessage(message, conversationId);

        if (success) {
            showToast("Agreement Sent", "Your roommate agreement has been sent to the conversation", "success");
            setAgreementText('');
            setSignature('');
        } else {
            showToast("Error", "Failed to send roommate agreement", "error");
        }
    };

    const handleSendToExistingGroup = () => {
        const formattedAgreement = formatAgreementMessage(agreementText, signature);
        sendAgreementToConversation(selectedConversationId, formattedAgreement);
    };

    return (
        <>
            <Container maxW="full">
                <Center>
                    <VStack spacing={6} width="100%" maxWidth="800px" p={4}>
                        <Heading size="lg">Roommate Agreement</Heading>
                        <Textarea
                            size="lg"
                            placeholder="Type Roommate Agreement Here"
                            value={agreementText}
                            onChange={(e) => setAgreementText(e.target.value)}
                            minHeight="200px"
                        />

                        <Input
                            placeholder="Your Signature"
                            value={signature}
                            onChange={(e) => setSignature(e.target.value)}
                        />

                        <Box width="100%">
                            <Heading size="md" mb={3}>Send Your Agreement</Heading>

                            <Flex direction={{ base: "column", md: "row" }} gap={4} width="100%" alignItems={"center"}>
                                <Box flex={1}>
                                    <Text fontWeight="bold" mb={2}>Select a group:</Text>
                                    {groupchats.length > 0 ? (
                                        <>
                                            <Box as="select"
                                                width="100%"
                                                p={2}
                                                borderRadius="md"
                                                borderColor="gray.300"
                                                mb={3}
                                                onChange={(e) => setSelectedConversationId(e.target.value)}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Select a group</option>
                                                {groupchats.map(group => (
                                                    <option key={group.id} value={group.id}>
                                                        {group.name}
                                                    </option>
                                                ))}
                                            </Box>
                                            <Button
                                                onClick={handleSendToExistingGroup}
                                                colorScheme="blue"
                                                width="100%"
                                                alignSelf={"center"}
                                                isDisabled={!selectedConversationId || !agreementText.trim() || !isConnected}
                                            >
                                                Send to Selected Group
                                            </Button>

                                            {!isConnected && (
                                                <Box mt={2}>
                                                    <Text as="span" color="red.500" fontSize="sm" ml={2}>
                                                        (Offline)
                                                    </Text>
                                                    {error && (
                                                        <Box bg="red.500" color="white" p={2} textAlign="center">
                                                            {error}
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}
                                        </>
                                    ) : (
                                        <Text color="gray.500">No existing group chats</Text>
                                    )}
                                </Box>
                            </Flex>
                        </Box>
                    </VStack>
                </Center>
            </Container>
        </>
    );
}