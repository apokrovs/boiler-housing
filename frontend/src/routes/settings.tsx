import {
    Avatar, Box,
    Button, Flex, Heading, HStack, IconButton, Stack,
    Text,
} from "@chakra-ui/react"
import {createFileRoute} from "@tanstack/react-router";

import { FaArrowLeft } from "react-icons/fa";

export const Route = createFileRoute("/settings")({
  component: Settings,
})

function Settings() {
  return (
      <Flex minH = '100dvh'>
        <Box background={"grey"} w='260px'>
          <IconButton aria-label={"Homepage"} icon={<FaArrowLeft />} bg="transparent"></IconButton>
          <Stack spacing={10} marginTop={5}alignItems={"stretch"}>
            <HStack p={5} spacing={3}>
               <Avatar size="lg" bg="#FFD700" color="grey">
                JD
              </Avatar>
              <Heading size="md">Purdue Pete</Heading>
            </HStack>
            <Stack spacing={'5px'}>
              <Button colorScheme={"grey"} h='50px' w='260px' _hover={{ bg: "darkgrey", color: "white" }}>User Profile
              </Button>
              <Button colorScheme={"grey"} h='50px' w='260px' _hover={{ bg: "darkgrey", color: "white" }}>Security
              </Button>
              <Button colorScheme={"grey"} h='50px' w='260px' _hover={{ bg: "darkgrey", color: "white" }}>Visibility
              </Button>
              <Button colorScheme={"grey"} h='50px' w='260px' _hover={{ bg: "darkgrey", color: "white" }}>Notifications
              </Button>
              <Button colorScheme={"grey"} h='50px' w='260px' _hover={{ bg: "darkgrey", color: "white" }}>System Settings
              </Button>
              <Button colorScheme={"grey"} h='50px' w='260px' _hover={{ bg: "darkgrey", color: "white" }}>Logout
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Box>
          <Text>Settings options go here</Text>
        </Box>
      </Flex>
  )
}