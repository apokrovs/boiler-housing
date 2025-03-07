import {
  Box,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FaUserAstronaut } from "react-icons/fa"
import { FiLogOut, FiUser } from "react-icons/fi"

import useAuth from "../../hooks/useAuth"
import useCustomToast from "../../hooks/useCustomToast"
import {PiUserSwitchDuotone} from "react-icons/pi";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {type ApiError, UserPublic, UsersService} from "../../client";
import {handleError} from "../../utils.ts";

const UserMenu = () => {
  const { logout } = useAuth()
  const showToast = useCustomToast()

  const handleLogout = async () => {
    logout()
  }
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  const switchProfile = useMutation({
    mutationFn: () => UsersService.updateActiveProfile(),
    onSuccess: () => {
      window.location.reload()
    },
    onError: (err: ApiError) => {
      console.log("Error:", err);
      handleError(err, showToast);
    },
    onSettled: () => {
      //
    },
  })


  return (
    <>
      {/* Desktop */}
      <Box
        display={{ base: "none", md: "block" }}
        position="fixed"
        top={7}
        right={9}
      >
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Options"
            icon={<FaUserAstronaut color="white" fontSize="18px" />}
            bg="ui.main"
            isRound
            data-testid="user-menu"
          />
          <MenuList>
            <MenuItem icon={<FiUser fontSize="18px" />} as={Link} to="settings">
              My profile
            </MenuItem>
            {currentUser?.profile_type === "Both" && (
                <MenuItem icon={<PiUserSwitchDuotone fontSize={"24px"}/>} onClick={() => switchProfile.mutate()}>
                  Change roles
                </MenuItem>
            )}
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
    </>
  )
}

export default UserMenu
