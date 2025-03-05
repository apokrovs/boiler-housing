import { Box, Flex, Icon, Text, useColorModeValue } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { FiBriefcase, FiHome, FiSettings, FiUsers} from "react-icons/fi"
import { FaHouseChimney, FaHeart } from "react-icons/fa6";

import type { UserPublic } from "../../client"

const items = [
  { icon: FiHome, title: "Dashboard", path: "/" },
  { icon: FiBriefcase, title: "Items", path: "/items" },
  { icon: FiSettings, title: "User Settings", path: "/settings" },
  { icon: FaHouseChimney, title: "Your Listings", path: "/settings"},
  { icon: FaHeart, title: "Liked Listings", path: "/settings"},
]

interface SidebarItemsProps {
  onClose?: () => void
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const textColor = useColorModeValue("ui.main", "ui.light")
  const bgActive = useColorModeValue("#f0eee2", "#68634a")
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  const filteredItems = items.filter((item) => {
    if (item.title === "Liked Listings") {
      return currentUser?.profile_type === "Renter" || currentUser?.profile_type === "Both";
    }
    if (item.title === "Your Listings") {
      return currentUser?.profile_type === "Leaser" || currentUser?.profile_type === "Both";
    }
    return true; // Show all other items
  });

  // const finalItems = currentUser?.is_superuser
  //   ? [...items, { icon: FiUsers, title: "Admin", path: "/admin" }]
  //   : items

  const listItems = filteredItems.map(({ icon, title, path }) => (
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
