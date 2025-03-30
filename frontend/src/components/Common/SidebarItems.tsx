import {Box, Flex, Icon, Text, useColorModeValue} from "@chakra-ui/react"
import {useQueryClient} from "@tanstack/react-query"
import {Link} from "@tanstack/react-router"
import {FiBriefcase, FiHome, FiFileText, FiSettings, FiUsers, FiMessageCircle, FiLayout} from "react-icons/fi"
import type {UserPublic} from "../../client"

const items = [
    {icon: FiLayout, title: "Dashboard", path: "/"},
    {icon: FiBriefcase, title: "Items", path: "/items"},
    {icon: FiSettings, title: "User Settings", path: "/settings"},
    {icon: FiMessageCircle, title: "Messages", path: "/chat"},
  { icon: FiUsers, title: "Roommates", path: "/roommates"}
]

interface SidebarItemsProps {
  onClose?: () => void
}

const SidebarItems = ({onClose}: SidebarItemsProps) => {
    const queryClient = useQueryClient()
    const textColor = useColorModeValue("ui.main", "ui.light")
    const bgActive = useColorModeValue("#f0eee2", "#68634a")
    const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

    let finalItems = [...items];
    if (currentUser?.profile_type === "Leaser" || currentUser?.profile_type === "Both") {
        finalItems.splice(2, 0, {icon: FiFileText, title: "My Listings", path: "/listings"});
    }
     if (currentUser?.profile_type === "Renter" || currentUser?.profile_type === "Both") {
        finalItems.splice(2, 0, {
            icon: FiHome,
            title: "Listings",
            path: "/renter_listings"});
    }
     if (currentUser?.is_superuser) {
        finalItems.push({icon: FiUsers, title: "Admin", path: "/admin"});
    }

  const listItems = finalItems.map(({ icon, title, path }) => (
    <Flex
      as={Link}
      to={path}
      h="100%"
      p={2}
      key={title}
      activeProps={{
        style: {
          background: bgActive,
          borderRadius: "12px",
        },
      }}
      color={textColor}
      onClick={onClose}
    >
      <Icon as={icon} alignSelf="center" />
      <Text ml={2} fontSize="xl">{title}</Text>
    </Flex>
  ))

  return (
    <>
      <Box>
        <Flex direction="row" gap={4} wrap="wrap">
        {listItems}
        </Flex>
      </Box>
    </>
  )
}

export default SidebarItems
