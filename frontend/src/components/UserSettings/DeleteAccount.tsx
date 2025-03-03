import {
  Button,
  Container,
  Heading, HStack, Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react"

import DeleteConfirmation from "./DeleteConfirmation"
import LeaserConfirmation from "./LeaserConfirmation"
import RenterConfirmation from "./RenterConfirmation"
import {useQueryClient} from "@tanstack/react-query";
import type {UserPublic} from "../../client";

const DeleteAccount = () => {
  const confirmationModal = useDisclosure()
  const leaserModal = useDisclosure()
  const renterModal = useDisclosure()
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
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
          { currentUser?.profile_type === "Both" && (
            <>
              <Text mt={4}> Delete Individual Profiles</Text>
              <HStack>
                <Button background={"#cc0b04"} color={"#FAFAFA"} variant="danger" mt={4} onClick={renterModal.onOpen}>
                  Delete Renter Profile
                </Button>
                <Button background={"#cc0b04"} color={"#FAFAFA"} variant="danger" mt={4} onClick={leaserModal.onOpen}>
                  Delete Leaser Profile
                </Button>
              </HStack></>
          )}
        </Stack>
        <DeleteConfirmation
          isOpen={confirmationModal.isOpen}
          onClose={confirmationModal.onClose}
        />
        <LeaserConfirmation
          isOpen={leaserModal.isOpen}
          onClose={leaserModal.onClose}
        />
        <RenterConfirmation
          isOpen={renterModal.isOpen}
          onClose={renterModal.onClose}
        />
      </Container>
    </>
  )
}
export default DeleteAccount
