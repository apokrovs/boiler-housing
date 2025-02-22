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
    Divider, IconButton,
} from '@chakra-ui/react';
import {
    createFileRoute,
} from "@tanstack/react-router"
import {useState} from "react";
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
    const [messages, setMessages] = useState<MessageProps[]>([]);
    const [inputText, setInputText] = useState('');
    const [selectedChat, setSelectedChat] = useState<string>('Alice')
    const [chats, setChats] = useState<string[]>(['Alice', 'Bob', 'Charlie']);
    const sendMessage = () => {
        if (inputText.trim() === '') return;

        const newMessage: MessageProps = {
            text: inputText,
            actor: 'user',
            bgColor: 'white',
            textColor: 'black'


        };
        setMessages([...messages, newMessage]);
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

    }

    const handleChatClick = (chat: string) => {
        setSelectedChat(chat);
    };

    return (
        <Flex h="100vh" py={12} >
            <Flex
                flexDirection="column"
                w="xs"
                m="auto"
                h="full"
                borderWidth="1px"
                roundedTop="lg"
                bg="white"
            >
                <HStack justifyContent="space-between" px={4} py={2}>
                    <Heading size="md" borderRadius="md" textAlign="center">Chats</Heading>
                    <IconButton
                        aria-label="Add chat"
                        icon={<AddIcon />}
                        size="sm"
                        variant="outline"
                    />
                </HStack>
               <Divider />
                <VStack  align="stretch">
                  {chats.map(chat => (
                        <Box
                            key={chat}
                            p={4}
                            bg={selectedChat === chat ? "gray.200" : "white"}
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

                <HStack p={4} bg="lightgrey" width="full">
                    <Heading size="lg" color="black" width="full">
                        Chat with {selectedChat}
                    </Heading>
                </HStack>

                <Stack
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
                    {messages.map((message, index) => (
                        <Message key={index} text={message.text} actor={message.actor} bgColor={message.bgColor}
                                 textColor={message.textColor}/>
                    ))}
                </Stack>

                <HStack p={4} bg="gray.100">
                    <Input
                        bg="white"
                        placeholder="Enter your text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        color="black"
                    />
                    <Button onClick={sendMessage} colorScheme="black" bg="white" color="black">
                        Send
                    </Button>
                </HStack>
            </Flex>
        </Flex>
    );
}

export default Messaging;
