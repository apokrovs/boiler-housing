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
} from '@chakra-ui/react';
import {
    createFileRoute,
} from "@tanstack/react-router"
import {useState} from "react";

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
    const sendMessage = () => {
        if (inputText.trim() === '') return;

        const newMessage: MessageProps = {
            text: inputText,
            actor: 'user',
            bgColor: 'lightgrey',
            textColor: 'black'
        };
        setMessages([...messages, newMessage]);
        setInputText('');

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
                bg="white"
            >
                <Heading size="md" mb={4}>Chats</Heading>
                <VStack spacing={4} align="stretch">
                    <Box p={4} bg="white" borderRadius="md" shadow="sm">
                        Chat with Alice
                    </Box>
                    <Box p={4} bg="white" borderRadius="md" shadow="sm">
                        Chat with Bob
                    </Box>
                    <Box p={4} bg="white" borderRadius="md" shadow="sm">
                        Chat with Charlie
                    </Box>
                </VStack>
            </Flex>
            <Flex
                flexDirection="column"
                w="2xl"
                m="auto"
                h="full"
                borderWidth="1px"
                roundedTop="lg"
                bg="white"
            >

                <HStack p={4} bg="lightgrey">
                    <Heading size="lg" color="black">
                        Bob
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
