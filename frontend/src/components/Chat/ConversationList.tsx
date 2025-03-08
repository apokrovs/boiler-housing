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
import {subscribeToMessageType} from './websocket';
import {MessagesService, UsersService} from '../../client';
import {ConversationPublic} from '../../client/types.gen';

interface ConversationListProps {
    selectedConversationId?: string;
    onSelectConversation: (conversationId: string, isGroup: boolean, name?: string) => void;
}

export const ConversationList = ({selectedConversationId, onSelectConversation}: ConversationListProps) => {
    const {user} = useAuth();
    const [conversations, setConversations] = useState<ConversationPublic[]>([]);
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

    // Subscribe to WebSocket events
    useEffect(() => {
        if (!user) return;

        // Handle new messages
        const unsubMessage = subscribeToMessageType('message', () => {
            // Refresh conversations to show the new message
            loadConversations(true);
        });

        // Handle sent message confirmations
        const unsubMessageSent = subscribeToMessageType('message_sent', () => {
            // Refresh conversations to show the new message
            loadConversations(true);
        });

        // Handle read receipts
        const unsubReadReceipt = subscribeToMessageType('read_receipt', () => {
            // Refresh to update unread counts
            loadConversations(true);
        });

        // Handle conversation changes (new, updated, deleted)
        const unsubConversationChange = subscribeToMessageType('conversation_updated', () => {
            loadConversations(true);
        });

        // Handle user blocking/unblocking
        const unsubUserBlocked = subscribeToMessageType('user_blocked', () => {
            loadConversations(true);
        });

        const unsubUserUnblocked = subscribeToMessageType('user_unblocked', () => {
            loadConversations(true);
        });

        return () => {
            unsubMessage();
            unsubMessageSent();
            unsubReadReceipt();
            unsubConversationChange();
            unsubUserBlocked();
            unsubUserUnblocked();
        };
    }, [user, loadConversations]);

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
                        const otherUser = conv.participants.find(p => p.user_id !== user.id);
                        if (!otherUser) return;

                        try {
                            const userData = await UsersService.readUserById({userId: otherUser.user_id});
                            names[conv.id] = userData.full_name || userData.email;
                        } catch (err) {
                            console.error(`Error fetching name for user ${otherUser.user_id}:`, err);
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
    const getConversationName = (conversation: ConversationPublic) => {
        if (conversation.name) return conversation.name;

        // For direct messages, use the cached name or fallback
        if (!conversation.is_group) {
            return conversationNames[conversation.id] || 'Direct Message';
        }

        return 'Group Chat';
    };

    // Handle conversation selection
    const handleSelectConversation = (conversation: ConversationPublic) => {
        if (conversation.is_group) {
            onSelectConversation(
                    conversation.id,
                    conversation.is_group,
                    getConversationName(conversation)
            );
        } else {
           onSelectConversation(
                    conversation.id,
                    false,
                    getConversationName(conversation)
            );
        }
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