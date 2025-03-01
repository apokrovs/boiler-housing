import {
  Button,
  Container,
  Heading, HStack, Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react"

import DeleteConfirmation from "./DeleteConfirmation"

const DeleteAccount = () => {
  const confirmationModal = useDisclosure()

  return (
    <>
      <Container maxW="full">
        <Heading size="sm" py={4}>
          Delete Account
        </Heading>
        <Text>
          Permanently delete your data and everything associated with your
          account.
        </Text>
         <Button background={"#cc0b04"} color={"#FAFAFA"} variant="danger" mt={4} onClick={confirmationModal.onOpen}>
           Delete Account
         </Button>
        <Stack>
          <Text mt={4}> Delete Individual Profiles</Text>
          <HStack>
            <Button background={"#cc0b04"} color={"#FAFAFA"} variant="danger" mt={4} onClick={confirmationModal.onOpen}>
              Delete Renter Profile
            </Button>
            <Button background={"#cc0b04"} color={"#FAFAFA"} variant="danger" mt={4} onClick={confirmationModal.onOpen}>
              Delete Leaser Profile
            </Button>
         </HStack>
        </Stack>
        <DeleteConfirmation
          isOpen={confirmationModal.isOpen}
          onClose={confirmationModal.onClose}
        />
      </Container>
    </>
  )
}
export default DeleteAccount
