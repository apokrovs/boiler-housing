import {
  Box,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
    Portal
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FaBars } from "react-icons/fa"
import { FiLogOut, FiUser, FiHelpCircle } from "react-icons/fi"

import useAuth from "../../hooks/useAuth"

const UserMenu = () => {
  const { logout } = useAuth()

  const handleLogout = async () => {
    logout()
  }

  return (
    <>
      {/* Desktop */}
      <Portal>
      <Box
        display={{ base: "none", md: "block" }}
        position="fixed"
        top={"18px"}
        right={9}
        zIndex={3}
      >
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Options"
            icon={<FaBars color="#CEB888" fontSize="24px" />}
            bg="ui.main"
            isRound
            data-testid="user-menu"
          />
          <MenuList>
            <MenuItem icon={<FiUser fontSize="18px" />} as={Link} to="settings">
              My profile
            </MenuItem>
            <MenuItem icon={<FiHelpCircle fontSize="18px" />} as={Link} to="/faq">
              FAQ
            </MenuItem>
            <MenuItem
              icon={<FiLogOut fontSize="18px" />}
              onClick={handleLogout}
              color="ui.danger"
              fontWeight="bold"
            >
              Log out
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
        </Portal>
    </>
  )
}

export default UserMenu
