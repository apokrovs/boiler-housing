// src/components/Chat/ConversationList.tsx
import {useState, useEffect, useCallback} from 'react';
import {
    Box,
    List,
    ListItem,
    Flex,
    Text,
    Avatar,
    Badge,
    useColorModeValue,
    Spinner,
    Button,
    Center
} from '@chakra-ui/react';
import useAuth from '../../hooks/useAuth';
import {socket} from './websocket';
import {MessagesService, UsersService} from '../../client';
import {Conversation} from '../../client/types.gen';

interface ConversationListProps {
    selectedConversationId?: string;
    onSelectConversation: (conversationId: string, isGroup: boolean, name?: string) => void;
}

export const ConversationList = ({selectedConversationId, onSelectConversation}: ConversationListProps) => {
    const {user} = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [conversationNames, setConversationNames] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const limit = 20;

    // Styling
    const selectedBg = useColorModeValue('yellow.50', 'yellow.900');
    const hoverBg = useColorModeValue('gray.100', 'gray.700');
    const unreadBadgeBg = useColorModeValue('yellow.500', 'yellow.200');
    const unreadBadgeColor = useColorModeValue('white', 'gray.800');

    // Load conversations
    const loadConversations = useCallback(async (refresh = false) => {
        try {
            setIsLoading(true);
            setError(null);

            const newPage = refresh ? 0 : page;
            const token = localStorage.getItem('access_token');

            if (!token) {
                setError('Not authenticated');
                setIsLoading(false);
                return;
            }

            const response = await MessagesService.getConversations({
                skip: newPage * limit,
                limit,
            });

            if (refresh) {
                setConversations(response.data);
            } else {
                setConversations(prev => [...prev, ...response.data]);
            }

            setHasMore(response.data.length === limit);
            setPage(refresh ? 1 : newPage + 1);
        } catch (err) {
            setError('Failed to load conversations');
            console.error('Error loading conversations:', err);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit]);

    // Initial load
    useEffect(() => {
        loadConversations(true);
    }, [loadConversations]);

    // WebSocket event handlers
    useEffect(() => {
        if (!socket) return;

        const handleSocketMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);

                // Handle new message event
                if (data.type === 'new_message') {
                    // Refresh conversations to show the new message
                    loadConversations(true);
                }

                // Handle read receipt event
                else if (data.type === 'read_receipt') {
                    // Update unread counts
                    setConversations(prevConversations =>
                            prevConversations.map(conv => {
                                if (conv.participants.includes(data.reader_id)) {
                                    return {
                                        ...conv,
                                        unread_count: Math.max(0, conv.unread_count - 1),
                                    };
                                }
                                return conv;
                            })
                    );
                }

                // Handle conversation opened event
                else if (data.type === 'conversation_opened') {
                    // Update unread count for this conversation
                    setConversations(prevConversations =>
                            prevConversations.map(conv => {
                                if (conv.id === data.conversation_id) {
                                    return {
                                        ...conv,
                                        unread_count: 0,
                                    };
                                }
                                return conv;
                            })
                    );
                }
            } catch (err) {
                console.error('Error handling WebSocket message:', err);
            }
        };

        socket.addEventListener('message', handleSocketMessage);

        return () => {
            if (socket) {
                socket.removeEventListener('message', handleSocketMessage);
            }
        };
    }, [socket, loadConversations]);

    // Load user names for direct messages
    useEffect(() => {
        const loadUserNames = async () => {
            if (!user || conversations.length === 0) return;

            const token = localStorage.getItem('access_token');
            if (!token) return;

            const directMessageConversations = conversations.filter(
                    conv => !conv.is_group && !conv.name
            );

            const names: Record<string, string> = {};

            await Promise.all(
                    directMessageConversations.map(async (conv) => {
                        // Find the other user ID in participants
                        const otherUserId = conv.participants.find(id => id !== user.id);
                        if (!otherUserId) return;

                        try {
                            const userData = await UsersService.readUserById({userId: otherUserId});
                            names[conv.id] = userData.full_name || userData.email;
                        } catch (err) {
                            console.error(`Error fetching name for user ${otherUserId}:`, err);
                            names[conv.id] = 'Unknown User';
                        }
                    })
            );

            setConversationNames(prev => ({...prev, ...names}));
        };

        loadUserNames();
    }, [conversations, user]);

    // Format timestamp for display
    const formatTime = (timestamp: string | null) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Today: show time
            return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        } else if (diffDays === 1) {
            // Yesterday
            return 'Yesterday';
        } else if (diffDays < 7) {
            // Within a week
            return date.toLocaleDateString([], {weekday: 'short'});
        } else {
            // Older
            return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
        }
    };

    // Get conversation display name
    const getConversationName = (conversation: Conversation) => {
        if (conversation.name) return conversation.name;

        // For direct messages, use the cached name or fallback
        if (!conversation.is_group) {
            return conversationNames[conversation.id] || 'Direct Message';
        }

        return 'Group Chat';
    };

    // Handle conversation selection
    const handleSelectConversation = (conversation: Conversation) => {
        onSelectConversation(
                conversation.id,
                conversation.is_group,
                getConversationName(conversation)
        );
    };

    // Load more conversations
    const loadMore = () => {
        if (!isLoading && hasMore) {
            loadConversations();
        }
    };

    return (
            <Box>
                <List spacing={0}>
                    {conversations.map(conversation => (
                            <ListItem
                                    key={conversation.id}
                                    onClick={() => handleSelectConversation(conversation)}
                                    bg={selectedConversationId === conversation.id ? selectedBg : undefined}
                                    _hover={{bg: selectedConversationId === conversation.id ? selectedBg : hoverBg}}
                                    cursor="pointer"
                                    borderBottom="1px solid"
                                    borderColor="gray.100"
                            >
                                <Flex p={3} alignItems="center">
                                    <Avatar
                                            size="sm"
                                            name={getConversationName(conversation)}
                                            mr={3}
                                            bg={conversation.is_group ? 'green.500' : 'yellow.500'}
                                    />

                                    <Box flex="1" overflow="hidden">
                                        <Flex justifyContent="space-between" alignItems="center">
                                            <Text fontWeight="bold" isTruncated>
                                                {getConversationName(conversation)}
                                            </Text>

                                            <Text fontSize="xs" color="gray.500">
                                                {formatTime(conversation.last_message_time ?? null)}
                                            </Text>
                                        </Flex>

                                        <Flex justifyContent="space-between" alignItems="center">
                                            <Text fontSize="sm" color="gray.600" isTruncated>
                                                {conversation.last_message || 'No messages yet'}
                                            </Text>

                                            {conversation.unread_count > 0 && (
                                                    <Badge
                                                            borderRadius="full"
                                                            px={2}
                                                            bg={unreadBadgeBg}
                                                            color={unreadBadgeColor}
                                                    >
                                                        {conversation.unread_count}
                                                    </Badge>
                                            )}
                                        </Flex>
                                    </Box>
                                </Flex>
                            </ListItem>
                    ))}
                </List>

                {isLoading && (
                        <Center p={4}>
                            <Spinner size="sm"/>
                        </Center>
                )}

                {!isLoading && hasMore && (
                        <Button
                                onClick={loadMore}
                                variant="ghost"
                                size="sm"
                                width="100%"
                                mt={2}
                        >
                            Load More
                        </Button>
                )}

                {error && (
                        <Text color="red.500" textAlign="center" p={2}>
                            {error}
                        </Text>
                )}

                {!isLoading && conversations.length === 0 && !error && (
                        <Text textAlign="center" color="gray.500" p={4}>
                            No conversations yet
                        </Text>
                )}
            </Box>
    );
};