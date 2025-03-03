import {useState, useEffect, useRef} from 'react';
import {
    Box,
    Flex,
    Text,
    Input,
    Button,
    Avatar,
    Spinner,
    useColorModeValue,
} from '@chakra-ui/react';
import useAuth from '../../hooks/useAuth';
import {socket, sendWebSocketMessage} from './websocket';
import {MessagesService} from '../../client';
import {MessagePublic, ReadReceipt} from '../../client/types.gen';


function debounce(func: Function, wait: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return function (...args: any[]) {
        const context = this;
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

interface ChatWindowProps {
    conversationId: string;
    isGroup: boolean;
    conversationName?: string;
}

interface MessageWithStatus extends MessagePublic {
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    isFromMe?: boolean;
    tempId?: string;
}

export const ChatWindow = ({
                               conversationId,
                               isGroup,
                               conversationName
                           }: ChatWindowProps) => {
    const {user} = useAuth();
    const [messages, setMessages] = useState<MessageWithStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [_error, setError] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const limit = 20;

    // Styling
    const myMessageBg = useColorModeValue('blue.100', 'blue.700');
    const otherMessageBg = useColorModeValue('gray.100', 'gray.700');
    const timeColor = useColorModeValue('gray.500', 'gray.400');

    // Load messages
    const loadMessages = async (refresh = false) => {
        try {
            if (refresh) {
                setIsLoading(true);
            } else {
                setIsLoadingMore(true);
            }

            setError(null);

            const newPage = refresh ? 0 : page;

            const response = await MessagesService.getConversationMessages({
                conversationId,
                isGroup,
                skip: newPage * limit,
                limit,
            });

            const newMessages = response.data.map(msg => ({
                ...msg,
                isFromMe: msg.sender_id === user?.id,
                status: getMessageStatus(msg),
            }));

            if (refresh) {
                setMessages(newMessages.reverse()); // Most recent last
            } else {
                setMessages(prev => [...newMessages.reverse(), ...prev]);
            }

            setHasMore(newMessages.length === limit);
            setPage(refresh ? 1 : newPage + 1);

            // Mark messages as read via WebSocket
            newMessages.forEach(msg => {
                if (!msg.isFromMe && socket && socket.readyState === WebSocket.OPEN) {
                    sendWebSocketMessage({
                        type: 'read_receipt',
                        message_id: msg.id
                    });
                }
            });

        } catch (err) {
            setError('Failed to load messages');
            console.error('Error loading messages:', err);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    // Get message status based on read receipts
    const getMessageStatus = (message: MessagePublic): 'sending' | 'sent' | 'delivered' | 'read' => {
        if (message.sender_id !== user?.id) {
            return 'read'; // Not relevant for received messages
        }

        if (message.read_by && message.read_by.length > 0) {
            return 'read';
        }

        return 'delivered'; // Default to delivered if message is in database
    };

    // Initial load
    useEffect(() => {
        loadMessages(true);

        // Notify server that this conversation is open
        if (socket && socket.readyState === WebSocket.OPEN) {
            sendWebSocketMessage({
                type: 'open_conversation',
                conversation_id: conversationId,
                is_group: isGroup
            });
        }

        // Clean up
        return () => {
            setMessages([]);
            setTypingUsers(new Set());

            // Notify server that conversation is closed
            if (socket && socket.readyState === WebSocket.OPEN) {
                sendWebSocketMessage({
                    type: 'close_conversation',
                    conversation_id: conversationId
                });
            }
        };
    }, [conversationId, isGroup]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({behavior: 'smooth'});
        }
    }, [messages]);

    // Handle WebSocket events
    useEffect(() => {
        if (!socket || !user) return;

        const handleSocketMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);

                // Handle new message
                if (data.type === 'new_message') {
                    // Check if this message belongs to the current conversation
                    const isCurrentConversation = isGroup
                            ? data.is_group_chat && data.receiver_ids.includes(conversationId)
                            : (
                                    (!data.is_group_chat) &&
                                    (
                                            (data.sender_id === conversationId && data.receiver_ids.includes(user.id)) ||
                                            (data.sender_id === user.id && data.receiver_ids.includes(conversationId))
                                    )
                            );

                    if (isCurrentConversation) {
                        // Add to messages
                        setMessages(prev => [
                            ...prev,
                            {
                                ...data,
                                isFromMe: data.sender_id === user.id,
                                status: 'delivered',
                                read_by: []
                            }
                        ]);

                        // Mark as read if not from me
                        if (data.sender_id !== user.id && socket && socket.readyState === WebSocket.OPEN) {
                            sendWebSocketMessage({
                                type: 'read_receipt',
                                message_id: data.id
                            });
                        }
                    }
                }

                // Handle read receipts
                else if (data.type === 'read_receipt') {
                    // Update message status
                    setMessages(prev => prev.map(msg => {
                        if (msg.id === data.message_id) {
                            // Create a new read receipt
                            const newReadReceipt: ReadReceipt = {
                                message_id: data.message_id,
                                user_id: data.reader_id,
                                read_at: data.timestamp
                            };

                            // Check if this receipt is already there
                            const alreadyExists = msg.read_by?.some(
                                    receipt => receipt.user_id === newReadReceipt.user_id
                            );

                            if (!alreadyExists) {
                                return {
                                    ...msg,
                                    status: 'read',
                                    read_by: [...(msg.read_by || []), newReadReceipt]
                                };
                            }
                        }
                        return msg;
                    }));
                }

                // Handle typing indicators
                else if (data.type === 'typing') {
                    // Check if relevant to this conversation
                    const isRelevantTyping =
                            (isGroup && data.is_group && data.conversation_id === conversationId) ||
                            (!isGroup && !data.is_group && data.user_id === conversationId);

                    if (isRelevantTyping) {
                        // Add to typing users
                        setTypingUsers(prev => new Set(prev).add(data.user_id));

                        // Clear after timeout
                        setTimeout(() => {
                            setTypingUsers(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(data.user_id);
                                return newSet;
                            });
                        }, 3000); // Clear typing indicator after 3 seconds
                    }
                }

                // Handle message_sent confirmation
                else if (data.type === 'message_sent') {
                    // Update temp message status
                    if (data.message_id) {
                        setMessages(prev => prev.map(msg =>
                                msg.tempId === data.message_id || msg.id === data.message_id
                                        ? {
                                            ...msg,
                                            id: data.message_id, // Replace temp ID with real ID
                                            status: data.status === 'delivered' ? 'delivered' : 'sent'
                                        }
                                        : msg
                        ));
                    }
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
    }, [socket, user, conversationId, isGroup]);

    // Debounced typing notification
    const debouncedTypingNotification = useRef(
            debounce(() => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    sendWebSocketMessage({
                        type: 'typing',
                        conversation_id: conversationId,
                        is_group: isGroup
                    });
                }
            }, 500)
    ).current;

    // Handle message input change
    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageText(e.target.value);

        // Send typing notification
        if (e.target.value.trim()) {
            debouncedTypingNotification();
        }
    };

    // Send message
    const handleSendMessage = async () => {
        if (!messageText.trim() || !user) return;

        // Create a temporary ID for tracking this message
        const tempId = `temp-${Date.now()}`;

        // Add to messages with temporary status
        const tempMessage: MessageWithStatus = {
            id: tempId as any, // Will be replaced with actual ID
            tempId,
            sender_id: user.id,
            receiver_ids: [conversationId],
            content: messageText,
            is_group_chat: isGroup,
            created_at: new Date().toISOString(),
            isFromMe: true,
            status: 'sending',
            read_by: []
        };

        setMessages(prev => [...prev, tempMessage]);

        // Send via WebSocket
        if (socket && socket.readyState === WebSocket.OPEN) {
            sendWebSocketMessage({
                type: 'message',
                content: messageText,
                receiver_ids: [conversationId],
                is_group_chat: isGroup
            });
        } else {
            // Fallback to REST API if WebSocket is not available
            try {
                await MessagesService.createMessage({
                    requestBody: {
                        content: messageText,
                        receiver_ids: [conversationId],
                        is_group_chat: isGroup
                    }
                });

                // Refresh messages
                loadMessages(true);
            } catch (err) {
                console.error('Error sending message via REST API:', err);

                // Mark the message as failed
                setMessages(prev => prev.map(msg =>
                        msg.tempId === tempId
                                ? {...msg, status: 'sent'}
                                : msg
                ));
            }
        }

        // Clear input
        setMessageText('');
    };

    // Load more messages
    const loadMoreMessages = () => {
        if (!isLoading && !isLoadingMore && hasMore) {
            loadMessages(false);
        }
    };

    // Handle scroll to load more
    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const {scrollTop} = messagesContainerRef.current;

            // Load more when scrolled near the top
            if (scrollTop < 50 && hasMore && !isLoadingMore) {
                loadMoreMessages();
            }
        }
    };

    // Format time for display
    const formatMessageTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    };

    // Get status icon based on message status
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sending':
                return '⏳';
            case 'sent':
                return '✓';
            case 'delivered':
                return '✓';
            case 'read':
                return '✓✓';
            default:
                return null;
        }
    };

    return (
            <Box height="100%" display="flex" flexDirection="column">
                {/* Header */}
                <Flex
                        p={4}
                        borderBottom="1px solid"
                        borderColor="gray.200"
                        alignItems="center"
                        bg={useColorModeValue('white', 'gray.800')}
                >
                    <Avatar
                            size="sm"
                            name={conversationName || 'Conversation'}
                            mr={3}
                            bg={isGroup ? 'green.500' : 'blue.500'}
                    />
                    <Box flex="1">
                        <Text fontWeight="bold">{conversationName || (isGroup ? 'Group Chat' : 'Direct Message')}</Text>
                        {typingUsers.size > 0 && (
                                <Text fontSize="xs" color="gray.500">
                                    {isGroup && typingUsers.size > 1
                                            ? 'Several people are typing...'
                                            : 'Typing...'}
                                </Text>
                        )}
                    </Box>
                </Flex>

                {/* Messages */}
                <Box
                        flex="1"
                        overflowY="auto"
                        p={4}
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        bg={useColorModeValue('gray.50', 'gray.900')}
                >
                    {isLoadingMore && (
                            <Flex justify="center" mb={4}>
                                <Spinner size="sm"/>
                            </Flex>
                    )}

                    {hasMore && !isLoadingMore && (
                            <Flex justify="center" mb={4}>
                                <Button size="xs" onClick={loadMoreMessages} variant="ghost">
                                    Load older messages
                                </Button>
                            </Flex>
                    )}

                    {isLoading ? (
                            <Flex justify="center" align="center" height="100%">
                                <Spinner/>
                            </Flex>
                    ) : (
                            <>
                                {messages.length === 0 ? (
                                        <Flex justify="center" align="center" height="100%">
                                            <Text color="gray.500">No messages yet</Text>
                                        </Flex>
                                ) : (
                                        messages.map((message) => (
                                                <Flex
                                                        key={message.id || message.tempId}
                                                        mb={3}
                                                        flexDirection={message.isFromMe ? 'row-reverse' : 'row'}
                                                        alignItems="flex-end"
                                                >
                                                    {!message.isFromMe && (
                                                            <Avatar
                                                                    size="xs"
                                                                    name={message.sender_id.substring(0, 2)}
                                                                    mr={message.isFromMe ? 0 : 2}
                                                                    ml={message.isFromMe ? 2 : 0}
                                                            />
                                                    )}

                                                    <Box
                                                            bg={message.isFromMe ? myMessageBg : otherMessageBg}
                                                            px={3}
                                                            py={2}
                                                            borderRadius="lg"
                                                            maxWidth="70%"
                                                            position="relative"
                                                    >
                                                        {isGroup && !message.isFromMe && (
                                                                <Text fontSize="xs" fontWeight="bold" mb={1}>
                                                                    {message.sender_id}
                                                                </Text>
                                                        )}

                                                        <Text>{message.content}</Text>

                                                        <Flex
                                                                fontSize="xs"
                                                                color={timeColor}
                                                                mt={1}
                                                                justifyContent={message.isFromMe ? 'flex-end' : 'flex-start'}
                                                                alignItems="center"
                                                        >
                                                            <Text>{formatMessageTime(message.created_at)}</Text>

                                                            {message.isFromMe && (
                                                                    <Box ml={1}
                                                                         color={message.status === 'read' ? 'blue.500' : undefined}>
                                                                        {getStatusIcon(message.status || 'sent')}
                                                                    </Box>
                                                            )}
                                                        </Flex>
                                                    </Box>
                                                </Flex>
                                        ))
                                )}
                                <div ref={messagesEndRef}/>
                            </>
                    )}
                </Box>

                {/* Input */}
                <Flex
                        p={4}
                        borderTop="1px solid"
                        borderColor="gray.200"
                        bg={useColorModeValue('white', 'gray.800')}
                >
                    <Input
                            placeholder="Type a message..."
                            value={messageText}
                            onChange={handleMessageChange}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            mr={2}
                    />
                    <Button
                            colorScheme="blue"
                            onClick={handleSendMessage}
                            isDisabled={!messageText.trim()}
                    >
                        Send
                    </Button>
                </Flex>
            </Box>
    );
};