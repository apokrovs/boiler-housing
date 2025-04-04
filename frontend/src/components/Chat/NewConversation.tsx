import {useState, useEffect} from 'react';
import {
    Box,
    Button,
    Flex,
    Input,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Switch,
    Checkbox,
    VStack,
    Avatar,
    Text,
    useDisclosure,
    useToast,
    Spinner
} from '@chakra-ui/react';
import {AddIcon} from '@chakra-ui/icons';
import useAuth from '../../hooks/useAuth';
import {UsersService, MessagesService} from '../../client';
import {UserPublic, ConversationCreate} from '../../client/types.gen';
import {sendChatMessage} from './websocket';

interface NewConversationProps {
    onNewConversation: (conversationId: string, isGroup: boolean, name?: string) => void;
    buttonColor?: string;
    buttonSize?: string;
    buttonWidth?: string;
    setGroup?: boolean;
    buttonText?: string
}

export const NewConversation = ({onNewConversation, buttonColor="yellow.500", buttonSize="sm", buttonWidth="100%", setGroup=false, buttonText="New Conversation" }: NewConversationProps) => {
    const {isOpen, onOpen, onClose} = useDisclosure();
    const {user} = useAuth();
    const [isGroup, setIsGroup] = useState(setGroup);
    const [groupName, setGroupName] = useState('');
    const [users, setUsers] = useState<UserPublic[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const toast = useToast();

    // Load users
    useEffect(() => {
        const loadUsers = async () => {
            if (!isOpen) return;

            try {
                setIsLoading(true);
                const token = localStorage.getItem('access_token');

                if (!token) {
                    toast({
                        title: 'Not authenticated',
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                    });
                    setIsLoading(false);
                    return;
                }

                const response = await UsersService.readUsers({skip: 0, limit: 100});
                // Filter out current user
                const otherUsers = response.data.filter(u => u.id !== user?.id);

                // Loop through each user and remove blocked ones
                const unblockedUsers = [];
                for (const u of otherUsers) {
                    const isBlocked = await MessagesService.checkUserBlocked({userId: u.id});
                    if (!isBlocked) {
                        unblockedUsers.push(u);
                    }
                }

                setUsers(unblockedUsers);
            } catch (error) {
                console.error('Error loading users:', error);
                toast({
                    title: 'Error loading users',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            loadUsers();
        }
    }, [isOpen, user, toast]);


    // Handle starting a new conversation
    const handleStartConversation = async () => {
        if (selectedUsers.length === 0) {
            toast({
                title: 'Select at least one user',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (isGroup && !groupName.trim()) {
            toast({
                title: 'Enter a group sender_name',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            setIsCreating(true);

            // Create the conversation in the backend
            const conversationData: ConversationCreate = {
                participant_ids: selectedUsers,
                is_group: isGroup,
                name: isGroup ? groupName : undefined
            };

            // Create the conversation
            const newConversation = await MessagesService.createConversation({
                requestBody: conversationData
            });

            // Start the conversation by sending the first message via WebSocket
            if (newConversation) {
                // Tell the parent component about the new conversation
                onNewConversation(
                        newConversation.id,
                        newConversation.is_group || false,
                        newConversation.name || undefined
                );

                // Send an initial greeting message
                const greeting = isGroup
                        ? `${user?.full_name || 'A user'} created this group conversation`
                        : 'Hello! Let\'s chat!';

                // Use WebSocket to send the first message
                sendChatMessage(greeting, newConversation.id);

                toast({
                    title: 'Conversation created',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            toast({
                title: 'Error creating conversation',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsCreating(false);

            // Reset and close
            setSelectedUsers([]);
            setGroupName('');
            setIsGroup(false);
            onClose();
        }
    };

    // Handle user selection
    const handleUserSelect = (userId: string) => {
        if (isGroup) {
            // For groups, allow multiple selections
            setSelectedUsers(prev =>
                    prev.includes(userId)
                            ? prev.filter(id => id !== userId)
                            : [...prev, userId]
            );
        } else {
            // For direct messages, only one selection
            setSelectedUsers([userId]);
        }
    };

    // Filter users based on search term
    const filteredUsers = searchTerm.trim()
            ? users.filter(user =>
                    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            : users;

    return (
            <>
                <Button
                        leftIcon={<AddIcon/>}
                        bgColor={buttonColor}
                        onClick={onOpen}
                        size={buttonSize}
                        width={buttonWidth}
                >
                    {buttonText}
                </Button>

                <Modal isOpen={isOpen} onClose={onClose} size="md">
                    <ModalOverlay/>
                    <ModalContent>
                        <ModalHeader>
                            {isGroup ? 'New Group Chat' : 'New Direct Message'}
                        </ModalHeader>
                        <ModalCloseButton/>

                        <ModalBody>
                            <FormControl display="flex" alignItems="center" mb={4}>
                                <FormLabel htmlFor="is-group" mb="0">
                                    Create a group chat
                                </FormLabel>
                                <Switch
                                        id="is-group"
                                        colorScheme="yellow"
                                        isChecked={isGroup}
                                        onChange={(e) => {
                                            setIsGroup(e.target.checked);
                                            setSelectedUsers([]);
                                        }}
                                />
                            </FormControl>

                            {isGroup && (
                                    <FormControl mb={4}>
                                        <FormLabel>Group Name</FormLabel>
                                        <Input
                                                placeholder="Enter group name"
                                                value={groupName}
                                                onChange={(e) => setGroupName(e.target.value)}
                                        />
                                    </FormControl>
                            )}

                            <FormControl mb={4}>
                                <FormLabel>
                                    {isGroup ? 'Select Participants' : 'Select User'}
                                </FormLabel>
                                <Input
                                        placeholder="Search users..."
                                        mb={4}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                />

                                {isLoading ? (
                                        <Flex justify="center" py={4}>
                                            <Spinner/>
                                        </Flex>
                                ) : (
                                        <Box maxHeight="300px" overflowY="auto">
                                            <VStack align="start" spacing={2}>
                                                {filteredUsers.map(user => (
                                                        <Flex
                                                                key={user.id}
                                                                w="100%"
                                                                p={2}
                                                                borderRadius="md"
                                                                _hover={{bg: 'gray.100'}}
                                                                cursor="pointer"
                                                                onClick={() => handleUserSelect(user.id)}
                                                        >
                                                            <Checkbox
                                                                    isChecked={selectedUsers.includes(user.id)}
                                                                    onChange={() => {
                                                                    }}
                                                                    mr={3}
                                                            />
                                                            <Avatar size="sm" name={user.full_name || user.email}
                                                                    mr={2}/>
                                                            <Box>
                                                                <Text fontWeight="medium">
                                                                    {user.full_name || 'Unnamed User'}
                                                                </Text>
                                                                <Text fontSize="sm" color="gray.500">
                                                                    {user.email}
                                                                </Text>
                                                            </Box>
                                                        </Flex>
                                                ))}

                                                {filteredUsers.length === 0 && (
                                                        <Text color="gray.500" py={2}>
                                                            No users found
                                                        </Text>
                                                )}
                                            </VStack>
                                        </Box>
                                )}
                            </FormControl>
                        </ModalBody>

                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isCreating}>
                                Cancel
                            </Button>
                            <Button
                                    bg="yellow.500"
                                    onClick={handleStartConversation}
                                    isLoading={isCreating}
                                    isDisabled={
                                            selectedUsers.length === 0 ||
                                            (isGroup && !groupName.trim()) ||
                                            isCreating
                                    }
                            >
                                Start Conversation
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </>
    );
};