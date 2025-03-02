import {
    Box,
    Button,
    Flex,
    Heading,
    HStack,
    Input,
    Stack,
    Text,
    VStack,
    Divider,
    IconButton,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Menu,
    MenuButton,
    MenuList,
    MenuItem
} from '@chakra-ui/react';
import {
    createFileRoute,
} from "@tanstack/react-router"
import {useState, useEffect, useRef} from "react";
import {AddIcon} from "@chakra-ui/icons";

export const Route = createFileRoute("/_layout/messaging")({
    component: Messaging,
})

type MessageProps = {
    text: string;
    actor: 'user';
    bgColor: string;
    textColor: string;
};


const Message = ({text, actor, onEdit, onDelete}: { text: string, actor:'user', onEdit: () => void, onDelete: () => void }) => {
    return (
      <Menu>
                <MenuButton as={Button} size="xs" ml={2}
            p={4}
            bg={"#dead16"}
            color={"black"}
            borderRadius="lg"
            w="fit-content"
            alignSelf={actor === 'user' ? 'flex-end' : 'flex-start'}
        >

                    <Text>{text}</Text>
                </MenuButton>
                <MenuList>
                    <MenuItem onClick={onEdit}>Edit</MenuItem>
                    <MenuItem onClick={onDelete}>Delete</MenuItem>
                </MenuList>
            </Menu>
    );
};

function Messaging() {
    const [newChatName, setNewChatName] = useState("");
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [chatMessages, setChatMessages] = useState<{ [key: string]: MessageProps[] }>({});
    const [inputText, setInputText] = useState('');
    const [selectedChat, setSelectedChat] = useState<string>('')
    const [chats, setChats] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
const [editingMessageIndex, setEditingMessageIndex] =useState<number | null> (null)
    const scrollToBottom = () => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }
    useEffect(() => {
        scrollToBottom();
    }, [chatMessages[selectedChat]]);

    const sendMessage = () => {
        if (inputText.trim() === '') return;

        const newMessage: MessageProps = {
            text: inputText,
            actor: 'user',
            bgColor: 'white',
            textColor: 'black'


        };

       if (editingMessageIndex !== null) {
            setChatMessages(prevMessages => {
                const updatedMessages = [...prevMessages[selectedChat]];
                updatedMessages[editingMessageIndex] = newMessage;
                return {
                    ...prevMessages,
                    [selectedChat]: updatedMessages,
                };
            });
            setEditingMessageIndex(null);
        } else {
            setChatMessages(prevMessages => ({
                ...prevMessages,
                [selectedChat]: [...prevMessages[selectedChat], newMessage],
            }));
        }
        setInputText('');

        setChats(prevChats => {
            const chatIndex = prevChats.indexOf(selectedChat);
            if (chatIndex > -1) {
                let updatedChats = [...prevChats];
                updatedChats.splice(chatIndex, 1);
                updatedChats.unshift(selectedChat);
                return updatedChats;
            }
            return prevChats;
        });
    }

    const addChat = () => {
        if (newChatName.trim() === "" || chats.includes(newChatName)) {
            return;
        }

        if (newChatName.includes(",")) {
            const groupChatName = newChatName.split(",").map(name => name.trim()).join(", ")
            if (!chats.includes(groupChatName)) {
                setChats(prevChats => [...prevChats, groupChatName]);
                setChatMessages(prevMessages => ({...prevMessages, [groupChatName]: []}))
            }
        } else {
            setChats(prevChats => [...prevChats, newChatName]);
            setChatMessages(prevMessages => ({...prevMessages, [newChatName]: []}));
        }
        setNewChatName("");
        onClose();
    }

    const handleChatClick = (chat: string) => {
        setSelectedChat(chat);
    };
    const handleKeyPress = (event: any) => {
        if (event.key === 'Enter' && inputText != '') {
            sendMessage()
        }
    };

    const handleEditMessage = (index: number) => {
        setEditingMessageIndex(index);
        setInputText(chatMessages[selectedChat][index].text);
    }

    const handleDeleteMessage= (index: number) => {
            setChatMessages(prevMessages => {
            const updatedMessages = [...prevMessages[selectedChat]];
            updatedMessages.splice(index, 1);
            return {
                ...prevMessages,
                [selectedChat]: updatedMessages,
            };
        });
    }

    return (
        <Flex h="100vh" py={12}>
            <Flex
                flexDirection="column"
                w="xs"
                m="auto"
                h="full"
                borderWidth="1px"
                roundedTop="lg"
                bg="gray.100"
            >
                <HStack justifyContent="space-between" px={4} py={2}>
                    <Heading size="md" borderRadius="md" textAlign="center">Chats</Heading>
                    <IconButton
                        aria-label="Add chat"
                        icon={<AddIcon/>}
                        size="sm"
                        variant="outline"
                        onClick={onOpen}
                        bg={"#dead16"}
                    />
                </HStack>
                <Divider/>
                <VStack align="stretch">
                    {chats.map(chat => (
                        <Box
                            key={chat}
                            p={4}
                            bg={selectedChat === chat ? "#dead16" : "white"}
                            borderRadius="md"
                            shadow="sm"
                            cursor="pointer"
                            onClick={() => handleChatClick(chat)}

                        >
                            Chat with {chat}
                        </Box>
                    ))}
                </VStack>
            </Flex>
            <Flex
                flexDirection="column"
                w="3xl"
                m="auto"
                h="full"
                borderWidth="1px"
                roundedTop="lg"
                bg="white"
            >

                <HStack p={4} bg="#dead16" width="full">
                    {selectedChat !== '' ? (<Heading size="lg" color="black" width="full">
                                Chat with {selectedChat}
                            </Heading>
                        )
                        :
                        (
                            <Heading size="lg" color="black" width="full">
                                Select or create a chat
                            </Heading>
                        )}
                </HStack>

                <Stack
                    ref={containerRef}
                    px={4}
                    py={8}
                    overflow="auto"
                    flex={1}
                    css={{

                        '&::-webkit-scrollbar': {
                            width: '4px',
                        },
                        '&::-webkit-scrollbar-track': {
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#d5e3f7',
                            borderRadius: '24px',
                        },
                    }}
                >
                    {(chatMessages[selectedChat] || []).map((message, index) => (
                        <Message key={index} text={message.text} actor={message.actor} bgColor={message.bgColor}
                                 textColor={message.textColor} onEdit={()=>handleEditMessage(index)} onDelete={()=>handleDeleteMessage(index)}/>
                    ))}
                </Stack>

                {selectedChat !== '' && (
                    <HStack p={4} bg="gray.200">
                        <Input
                            bg="white"
                            placeholder="Enter your text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            color="black"
                            onKeyPress={handleKeyPress}
                        />
                        <Button onClick={sendMessage} bg="#dead16">
                            {editingMessageIndex !== null ? 'Update' : 'Send'}
                        </Button>
                    </HStack>
                )}
                <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalOverlay/>
                    <ModalContent>
                        <ModalHeader>Add a New Chat</ModalHeader>
                        <Text ml={7}>When making a group chat, use commas.</Text>
                        <ModalCloseButton/>
                        <ModalBody>
                            <Input
                                placeholder="Enter name/names"
                                value={newChatName}
                                onChange={(e) => setNewChatName(e.target.value)}
                            />
                        </ModalBody>
                        <ModalFooter display="flex" justifyContent="center">
                            <Button bg="#dead16" mr={3} onClick={addChat}>Add</Button>
                            <Button variant="ghost" bgColor="gray.200" _hover={{bg: "gray.300"}}
                                    onClick={onClose}>Cancel</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </Flex>
        </Flex>
    );
}


export default Messaging;
