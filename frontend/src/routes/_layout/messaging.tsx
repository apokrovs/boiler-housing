import {
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
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
};

const Message = ({ text, actor }: MessageProps) => {
  return (
    <Flex
      p={4}
      bg={actor === 'user' ? 'blue.500' : 'gray.100'}
      color={actor === 'user' ? 'white' : 'gray.600'}
      borderRadius="lg"
      w="fit-content"
      alignSelf={actor === 'user' ? 'flex-end' : 'flex-start'}
    >
      <Text>{text}</Text>
    </Flex>
  );
};

function Messaging () {
    const [messages, setMessages] = useState<MessageProps[]>([]);
  const[inputText, setInputText] = useState('');
  const sendMessage = () => {
    if (inputText.trim() === '') return;

    const newMessage: MessageProps = {
      text: inputText,
      actor: 'user',
    };
    setMessages([...messages, newMessage]);
    setInputText('');

  }
  return (
    <Flex h="100vh" py={12}>
      <Flex
        flexDirection="column"
        w="2xl"
        m="auto"
        h="full"
        borderWidth="1px"
        roundedTop="lg"
      >
        <HStack p={4} bg="blue.500">
          <Heading size="lg" color="white">
            Chat App
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
            <Message key={index} text={message.text} actor={message.actor} />
          ))}
        </Stack>

        <HStack p={4} bg="gray.100">
          <Input
            bg="white"
            placeholder="Enter your text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <Button onClick={sendMessage} colorScheme="blue">
            Send
          </Button>
        </HStack>
      </Flex>
    </Flex>
  );
}
export default Messaging;
