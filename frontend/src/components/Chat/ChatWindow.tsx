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
    MenuButton,
    Menu,
    MenuList,
    MenuItem,
} from '@chakra-ui/react';
import useAuth from '../../hooks/useAuth';
import {
    subscribeToMessageType,
    sendChatMessage,
    editMessage,
    deleteMessage,
    markMessageAsRead,
    sendTypingIndicator,
    openConversation,
    closeConversation,
    blockUser,
    unblockUser
} from './websocket';
import { MessagesService, UsersService} from '../../client';
import {MessagePublic} from '../../client';

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
                               conversationName,
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
    const [isBlocked, setIsBlocked] = useState(false);
    const [editingMessage, setEditingMessage] = useState<MessageWithStatus | null>(null);
    const [editText, setEditText] = useState<string>('');
    const [participants, setParticipants] = useState<string[]>([]);

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
                skip: newPage * limit,
                limit,
            });

            // Load participants if this is the first load
            if (refresh) {
                try {
                    const conversationDetails = await MessagesService.getConversationById({
                        conversationId
                    });
                    setParticipants(conversationDetails.participants.map(p => p.user_id));
                } catch (err) {
                    console.error('Error loading participants:', err);
                }
            }

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

            // Mark messages as read
            if (response.data.length > 0) {
                markConversationAsRead();
            }

        } catch (err) {
            setError('Failed to load messages');
            console.error('Error loading messages:', err);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    // Mark all messages in conversation as read
    const markConversationAsRead = async () => {
        try {
            await MessagesService.markConversationRead({
                conversationId
            });
        } catch (err) {
            console.error('Error marking conversation as read:', err);
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
        openConversation(conversationId);

        // Clean up
        return () => {
            setMessages([]);
            setTypingUsers(new Set());

            // Notify server that conversation is closed
            closeConversation(conversationId);
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
        if (!user) return;

        // Subscribe to new messages
        const unsubMessage = subscribeToMessageType('message', (data) => {
            data = data.data
            // Check if this message belongs to the current conversation
            if (data.conversation_id === conversationId) {
                // Add the message to the state
                setMessages(prev => [
                    ...prev,
                    {
                        ...data,
                        isFromMe: data.sender_id === user.id,
                        status: 'delivered',
                        read_by: []
                    }
                ]);

                // Mark as read
                markMessageAsRead(data.id, conversationId);
            }
        });

        // Subscribe to message sent confirmations
        const unsubMessageSent = subscribeToMessageType('message_sent', (data) => {
            // Update temp message with confirmed data
            if (data.conversation_id === conversationId) {
                setMessages(prev => prev.map(msg =>
                    msg.tempId === data.message_id || msg.id === data.message_id
                        ? {
                            ...msg,
                            id: data.message_id,
                            status: 'sent'
                        }
                        : msg
                ));
            }
        });

        // Subscribe to message updates
        const unsubMessageUpdate = subscribeToMessageType('message_update', (data) => {
            data = data.data
            if (data.conversation_id === conversationId) {
                setMessages(prev => prev.map(msg =>
                    msg.id === data.id
                        ? {
                            ...msg,
                            content: data.content,
                            updated_at: data.updated_at
                        }
                        : msg
                ));
            }
        });

        // Subscribe to message deletions
        const unsubMessageDelete = subscribeToMessageType('message_delete', (data) => {
            if (data.conversation_id === conversationId) {
                setMessages(prev => prev.map(msg =>
                    msg.id === data.message_id
                        ? {
                            ...msg,
                            deleted: true,
                            content: "This message was deleted"
                        }
                        : msg
                ));
            }
        });

        // Subscribe to typing notifications
        const unsubTyping = subscribeToMessageType('typing', (data) => {
            console.log("typing", data);
            if (data.conversation_id === conversationId && data.user_id !== user.id) {
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
        });

        // Subscribe to read receipts
        const unsubReadReceipt = subscribeToMessageType('read_receipt', (data) => {
            console.log("read receipt:", data);
            if (data.conversation_id === conversationId) {
                // Update message read status
                setMessages(prev => prev.map(msg => {
                    if (msg.id === data.message_id) {
                        // Check if this receipt already exists
                        const existingReceipt = msg.read_by?.some(
                            receipt => receipt.user_id === data.reader_id
                        );

                        if (!existingReceipt) {
                            return {
                                ...msg,
                                status: 'read',
                                read_by: [
                                    ...(msg.read_by || []),
                                    {
                                        user_id: data.reader_id,
                                        read_at: data.timestamp
                                    }
                                ]
                            };
                        }
                    }
                    return msg;
                }));
            }
        });

        // Subscribe to user blocked/unblocked events
        const unsubBlocked = subscribeToMessageType('user_blocked', (data) => {
            // If another user blocked us
            if (data.blocker_id === conversationId) {
                setIsBlocked(true);
            }
        });

        const unsubUnblocked = subscribeToMessageType('user_unblocked', (data) => {
            // If another user unblocked us
            if (data.unblocker_id === conversationId) {
                setIsBlocked(false);
            }
        });

        // Return cleanup function
        return () => {
            unsubMessage();
            unsubMessageSent();
            unsubMessageUpdate();
            unsubMessageDelete();
            unsubTyping();
            unsubReadReceipt();
            unsubBlocked();
            unsubUnblocked();
        };
    }, [user, conversationId]);

    // Debounced typing notification
    const debouncedTypingNotification = useRef(
        debounce(() => {
            sendTypingIndicator(conversationId);
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
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Add to messages with temporary status
        const tempMessage: MessageWithStatus = {
            id: tempId as any, // Will be replaced with actual ID
            tempId,
            sender_id: user.id,
            conversation_id: conversationId,
            content: messageText,
            created_at: new Date().toISOString(),
            isFromMe: true,
            status: 'sending',
            read_by: [],
            deleted: false
        };

        setMessages(prev => [...prev, tempMessage]);

        // First, get the emails of the participants
        console.log("Does htis part run?");
        if (participants && user.full_name) {
            console.log("i forgot admin no username");
            for (const participant of participants) {

                if (participant !== user.id) {
                    const userData = await UsersService.readUserById({userId: participant});
                    MessagesService.newMessageEmail({
                        senderName: user.full_name,
                        email: userData.email,
                        message: messageText
                    })
                }
            }
        }
        const success = sendChatMessage(messageText, conversationId, participants);

        if (!success) {
            // Fallback to REST API if WebSocket is not available
            try {
                await MessagesService.createMessage({
                    requestBody: {
                        conversation_id: conversationId,
                        content: messageText
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

    const handleEditMessage = (message: MessageWithStatus) => {
        console.log("edit message:", message);
        // Only allow editing your own messages
        if (message.sender_id !== user?.id) return;

        setEditingMessage(message);
        setEditText(message.content);
    };

    const handleDeleteMessage = (message: MessageWithStatus) => {
        console.log("deleteMessage:", message);
        // Only allow deleting your own messages
        if (message.sender_id !== user?.id) return;

        if (window.confirm(`Are you sure you want to delete this message?`)) {
            // Send delete request
            deleteMessage(message.id);

            // Optimistically update UI
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.id === message.id
                        ? {...msg, deleted: true, content: "This message was deleted"}
                        : msg
                )
            );
        }
    };

    const handleBlockUser = () => {
        if (isGroup) return; // Can't block groups

        if (window.confirm(`Are you sure you want to block ${conversationName}?`)) {
            // Iterate through participants and ignore your own user id
            participants.forEach((participantId) => {
                // Check if the current participant's UUID is not equal to the current user's id.
                if (user && participantId !== user.id) {
                    // Call the blockUser function for the other participant.
                    blockUser(participantId);
                }
            });
            setIsBlocked(true);
        }
    };

    const handleSaveEdit = () => {
        if (!editingMessage) return;

        // Send edit request
        editMessage(editingMessage.id, editText);

        // Optimistically update UI
        setMessages(prevMessages =>
            prevMessages.map(msg =>
                msg.id === editingMessage.id
                    ? {...msg, content: editText, updated_at: new Date().toISOString()}
                    : msg
            )
        );

        setEditingMessage(null);
        setEditText('');
    };

    const handleUnblockUser = () => {
        if (isGroup) return; // Can't unblock groups

        if (window.confirm(`Are you sure you want to unblock ${conversationName}?`)) {
            unblockUser(conversationId);
            setIsBlocked(false);
        }
    };

    return (
        <Box
            height="85vh"
            width="100%"
            display="flex"
            flexDirection="column"
            bg={useColorModeValue('white', 'gray.800')}
        >
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
                    bg={isGroup ? 'green.500' : 'yellow.500'}
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
                {!isGroup && (
                    <Button
                        size="sm"
                        colorScheme={isBlocked ? "green" : "red"}
                        onClick={isBlocked ? handleUnblockUser : handleBlockUser}
                    >
                        {isBlocked ? "Unblock" : "Block"}
                    </Button>
                )}
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
                    isBlocked ? (
                        <Flex justify="center" align="center" height="100%">
                            <Text color="red.500">You have blocked this user.</Text>
                            <Button onClick={handleUnblockUser} ml={2}>Unblock</Button>
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
                                                // sender_name={message.sender_id.substring(0, 2)}
                                                mr={message.isFromMe ? 0 : 2}
                                                ml={message.isFromMe ? 2 : 0}
                                            />
                                        )}

                                        <Menu placement="bottom"
                                              portalProps={{appendToParentPortal: false}}>
                                            <MenuButton
                                                as={Button}
                                                p={0}  // Remove padding so the content controls the width
                                                bg={message.isFromMe ? 'yellow.500' : 'gray.100'}
                                                color="black"
                                                borderRadius="lg"
                                                maxW="70%"
                                                h={"100%"}
                                                display="inline-block"
                                                textAlign="left"
                                                whiteSpace="pre-wrap"
                                                wordBreak="break-word"
                                                _hover={{bg: message.isFromMe ? 'yellow.600' : 'gray.200'}}
                                                isDisabled={message.deleted}
                                            >
                                                <Box
                                                    p={3}  // Add padding inside the box, not the button itself
                                                    whiteSpace="pre-wrap"
                                                    wordBreak="break-word"
                                                    w="100%"  // Let the box grow to fill the button's width
                                                >
                                                    {editingMessage?.id === message.id ? (
                                                        <Input
                                                            size="sm"
                                                            value={editText}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            onBlur={handleSaveEdit}
                                                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <Text
                                                            fontSize="md"
                                                            lineHeight="short"
                                                            color={message.deleted ? "gray.500" : "inherit"}
                                                            fontStyle={message.deleted ? "italic" : "normal"}
                                                        >
                                                            {message.content}
                                                            {message.updated_at && !message.deleted && (
                                                                <Text as="span"
                                                                      fontSize="xs"
                                                                      color="gray.500"
                                                                      ml={1}>
                                                                    (edited)
                                                                </Text>
                                                            )}
                                                        </Text>
                                                    )}
                                                </Box>
                                            </MenuButton>

                                            <MenuList zIndex="popover">
                                                {message.isFromMe && !message.deleted && (
                                                    <>
                                                        <MenuItem
                                                            onClick={() => handleEditMessage(message)}>Edit</MenuItem>
                                                        <MenuItem
                                                            onClick={() => handleDeleteMessage(message)}>Delete</MenuItem>
                                                    </>
                                                )}
                                            </MenuList>
                                        </Menu>
                                    </Flex>
                                ))
                            )}
                            <div ref={messagesEndRef}/>
                        </>
                    ))}
            </Box>

            {/* Input */}
            <Flex
                p={4}
                borderTop="1px solid"
                borderColor="gray.200"
                bg={useColorModeValue('white', 'gray.800')}
            >
                <Input
                    placeholder={isBlocked ? "You cannot send messages to this user" : "Type a message..."}
                    value={messageText}
                    onChange={handleMessageChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    mr={2}
                    isDisabled={isBlocked}
                    focusBorderColor="yellow.500"
                />
                <Button
                    colorScheme="yellow"
                    onClick={handleSendMessage}
                    isDisabled={!messageText.trim() || isBlocked}
                >
                    Send
                </Button>
            </Flex>
        </Box>
    );
};