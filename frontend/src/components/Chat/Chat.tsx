import {useState, useEffect, useRef} from 'react';
import {Box, Flex, Heading, Text, useColorModeValue, useToast} from '@chakra-ui/react';
import useAuth from '../../hooks/useAuth';
import {ConversationList} from './ConversationList';
import {ChatWindow} from './ChatWindow';
import {NewConversation} from './NewConversation';
import {socket, createWebSocketConnection, sendWebSocketMessage, scheduleReconnection} from './websocket';

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
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // Connect to WebSocket when component mounts
    useEffect(() => {
        if (!user) return;

        const connectWebSocket = () => {
            const newSocket = createWebSocketConnection();

            if (!newSocket) {
                setError('Could not create WebSocket connection. Please check your authentication.');
                return;
            }

            newSocket.onopen = () => {
                setIsConnected(true);
                setError(null);
                reconnectAttempts.current = 0;
                toast({
                    title: 'Connected to chat',
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                    position: 'bottom-right',
                });

                // If you had a selected conversation, reopen it
                if (selectedConversation) {
                    sendWebSocketMessage({
                        type: 'open_conversation',
                        conversation_id: selectedConversation.id,
                        is_group: selectedConversation.isGroup,
                    });
                }
            };

            newSocket.onclose = (event) => {
                setIsConnected(false);

                console.log(`WebSocket closed with code ${event.code}`);

                // Only try to reconnect if not a normal closure or auth failure
                if (event.code !== 1000 && event.code !== 1008) {
                    if (reconnectAttempts.current < maxReconnectAttempts) {
                        reconnectAttempts.current += 1;

                        // Use the new scheduleReconnection helper
                        scheduleReconnection(
                                reconnectAttempts.current,
                                maxReconnectAttempts,
                                connectWebSocket
                        );
                    } else {
                        setError('Connection lost. Please refresh the page to reconnect.');
                    }
                }
            };

            newSocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('WebSocket error occurred');
                // We don't need to do anything here as the onclose handler will be called
            };

            // Add a message handler to receive server messages
            newSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Log pongs to verify the connection is alive
                    if (data.type === 'pong') {
                        console.log('Received pong from server');
                    } else if (data.error) {
                        console.error('Server error:', data.error);
                    }

                    // Handle other message types as needed
                    // ... your existing message handling code
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };
        };

        // Initial connection
        connectWebSocket();

        // Clean up on unmount
        return () => {
            // The socket cleanup is now handled in createWebSocketConnection
            if (socket && socket.readyState !== WebSocket.CLOSED) {
                socket.close(1000, 'Component unmounted');
            }
        };
    }, [user, toast, selectedConversation, maxReconnectAttempts]);

    // Handle conversation selection
    const handleSelectConversation = (conversationId: string, isGroup: boolean, name?: string) => {
        setSelectedConversation({
            id: conversationId,
            isGroup,
            name,
        });

        // Notify server that user opened this conversation
        if (socket && socket.readyState === WebSocket.OPEN) {
            sendWebSocketMessage({
                type: 'open_conversation',
                conversation_id: conversationId,
                is_group: isGroup,
            });
        }
    };

    // Create a new conversation
    const handleNewConversation = (userId: string, isGroup: boolean, name?: string) => {
        handleSelectConversation(userId, isGroup, name);
    };

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    return (
            <Box height="100%" overflow="hidden">
                <Flex
                        height="100%"
                        direction="column"
                >
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