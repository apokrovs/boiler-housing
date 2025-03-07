import {useState, useEffect} from 'react';
import {Box, Flex, Heading, Text, useColorModeValue, useToast} from '@chakra-ui/react';
import useAuth from '../../hooks/useAuth';
import {ConversationList} from './ConversationList';
import {ChatWindow} from './ChatWindow';
import {NewConversation} from './NewConversation';
import {createWebSocketConnection, subscribeToMessageType, closeWebSocketConnection} from './websocket';

interface SelectedConversation {
    id: string;
    isGroup: boolean;
    name?: string;
}

export const Chat = () => {
    const {user} = useAuth();
    const [selectedConversation, setSelectedConversation] = useState<SelectedConversation | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
            toast({
                title: 'Connected to chat',
                status: 'success',
                duration: 2000,
                isClosable: true,
                position: 'bottom-right',
            });
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

    // Handle conversation selection
    const handleSelectConversation = (conversationId: string, isGroup: boolean, name?: string) => {
        setSelectedConversation({
            id: conversationId,
            isGroup,
            name,
        });
    };

    // Create a new conversation
    const handleNewConversation = (conversationId: string, isGroup: boolean, name?: string) => {
        handleSelectConversation(conversationId, isGroup, name);
    };

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    return (
        <Box height="100%" overflow="hidden">
            <Flex height="100%" direction="column">
                <Heading size="lg" p={4} borderBottom="1px solid" borderColor={borderColor}>
                    Messages
                    {!isConnected && (
                        <Text as="span" color="red.500" fontSize="sm" ml={2}>
                            (Offline)
                        </Text>
                    )}
                </Heading>

                {error && (
                    <Box bg="red.500" color="white" p={2} textAlign="center">
                        {error}
                    </Box>
                )}

                <Flex flex="1" overflow="hidden">
                    <Box
                        width="300px"
                        borderRight="1px solid"
                        borderColor={borderColor}
                        bg={bgColor}
                        overflowY="auto"
                    >
                        <Box p={3}>
                            <NewConversation onNewConversation={handleNewConversation}/>
                        </Box>
                        <ConversationList
                            selectedConversationId={selectedConversation?.id}
                            onSelectConversation={handleSelectConversation}
                        />
                    </Box>

                    <Box flex="1" overflowY="hidden" bg={bgColor}>
                        {selectedConversation ? (
                            <ChatWindow
                                key={selectedConversation.id}
                                conversationId={selectedConversation.id}
                                isGroup={selectedConversation.isGroup}
                                conversationName={selectedConversation.name}
                            />
                        ) : (
                            <Flex
                                height="100%"
                                alignItems="center"
                                justifyContent="center"
                                flexDirection="column"
                                p={8}
                                color="gray.500"
                            >
                                <Text fontSize="xl">Select a conversation or start a new one</Text>
                            </Flex>
                        )}
                    </Box>
                </Flex>
            </Flex>
        </Box>
    );
};