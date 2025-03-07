import {Flex, Spinner} from "@chakra-ui/react"
import {Outlet, createFileRoute, redirect} from "@tanstack/react-router"
import {useNavigate} from "@tanstack/react-router"

import Sidebar from "../components/Common/Sidebar"
import UserMenu from "../components/Common/UserMenu"
import useAuth, {isLoggedIn} from "../hooks/useAuth"
import {useEffect, useState} from "react"
import {useQueryClient} from "@tanstack/react-query";
import {UserPublic} from "../client";
import {
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@chakra-ui/react"

export const Route = createFileRoute("/_layout")({
    component: Layout,
    beforeLoad: async () => {
        if (!isLoggedIn()) {
            throw redirect({
                to: "/login",
            })
        }
    },
})

function Layout() {
    const {isLoading} = useAuth()
    const [show2FAModal, setShow2FAModal] = useState(false);
    const queryClient = useQueryClient()
    const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user exists and 2FA is not enabled
        if (currentUser && !currentUser?.is_2fa_enabled) {
            setShow2FAModal(true);
        }
    }, [currentUser]);

    return (
        <Flex maxW="large" h="auto" position="relative" flexDir={"column"}>
            <Sidebar/>
            {isLoading ? (
                <Flex justify="center" align="center" height="100vh" width="full">
                    <Spinner size="xl" color="ui.main"/>
                </Flex>
            ) : (
                <Outlet/>
            )}
            <UserMenu/>

            <Modal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)} isCentered>
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>Enable Two-Factor Authentication</ModalHeader>
                    <ModalBody>
                        For better security, we recommend enabling Two-Factor Authentication.
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            colorScheme="blue"
                            onClick={() => {
                                setShow2FAModal(false); // Close the modal
                                navigate({to: "/settings"}); // Navigate within the app
                            }}
                        >
                            Enable 2FA
                        </Button>
                        <Button onClick={() => setShow2FAModal(false)} ml={3}>
                            Remind Me Later
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Flex>
    )
}
