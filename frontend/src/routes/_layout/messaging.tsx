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
    actor: 'user' | 'user2';
    bgColor: string;
    textColor: string;
};


const Message = ({text, actor}: MessageProps) => {
    return (
        <Flex
            p={4}
            bg={"darkgrey"}
            color={"black"}
            borderRadius="lg"
            w="fit-content"
            alignSelf={actor === 'user' ? 'flex-end' : 'flex-start'}
        >
            <Text>{text}</Text>
        </Flex>
    );
};

function Messaging() {
    const [newChatName, setNewChatName] = useState("");
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [chatMessages, setChatMessages] = useState<{ [key: string]: MessageProps[] }>({
        Alice: [],
        Bob: [],
        Charlie: [],
    });
    const [inputText, setInputText] = useState('');
    const [selectedChat, setSelectedChat] = useState<string>('Alice')
    const [chats, setChats] = useState<string[]>(['Alice', 'Bob', 'Charlie']);

    const containerRef = useRef<HTMLDivElement>(null);

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

        setChatMessages(prevMessages => ({
            ...prevMessages,
            [selectedChat]: [...prevMessages[selectedChat], newMessage],
        }))
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

        setChats(prevChats => [...prevChats, newChatName]);
        setChatMessages(prevMessages => ({...prevMessages, [newChatName]: []}));
        setNewChatName("");
        onClose();
    }

    const handleChatClick = (chat: string) => {
        setSelectedChat(chat);
    };
    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && inputText != '') {
            sendMessage()
        }
    };

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
                <HStack justifyContent="space-between" px={4} py={2} >
                    <Heading size="md" borderRadius="md" textAlign="center">Chats</Heading>
                    <IconButton
                        aria-label="Add chat"
                        icon={<AddIcon/>}
                        size="sm"
                        variant="outline"
                        onClick={onOpen}
                        bg={"yellow.400"}
                    />
                </HStack>
                <Divider/>
                <VStack align="stretch">
                    {chats.map(chat => (
                        <Box
                            key={chat}
                            p={4}
                            bg={selectedChat === chat ? "yellow.400" : "white"}
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

                <HStack p={4} bg="yellow.400" width="full">
                    <Heading size="lg" color="black" width="full">
                        Chat with {selectedChat}
                    </Heading>
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
                    {chatMessages[selectedChat].map((message, index) => (
                        <Message key={index} text={message.text} actor={message.actor} bgColor={message.bgColor}
                                 textColor={message.textColor}/>
                    ))}
                </Stack>

                <HStack p={4} bg="gray.200">
                    <Input
                        bg="white"
                        placeholder="Enter your text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        color="black"
                        onKeyPress={handleKeyPress}
                    />
                    <Button onClick={sendMessage} colorScheme="yellow" >
                        Send
                    </Button>
                </HStack>
                <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalOverlay/>
                    <ModalContent>
                        <ModalHeader>Add a New Chat</ModalHeader>
                        <ModalCloseButton/>
                        <ModalBody>
                            <Input
                                placeholder="Enter name"
                                value={newChatName}
                                onChange={(e) => setNewChatName(e.target.value)}
                            />
                        </ModalBody>
                        <ModalFooter display="flex" justifyContent="center" >
                            <Button colorScheme="yellow" mr={3} onClick={addChat}>Add</Button>
                            <Button variant="ghost" bgColor= "gray.200"  _hover={{ bg: "gray.300" }} onClick={onClose}>Cancel</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </Flex>
        </Flex>
    );
}


export default Messaging;
