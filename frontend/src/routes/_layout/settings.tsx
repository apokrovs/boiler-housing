import {
  Container,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import type { UserPublic } from "../../client"
import Appearance from "../../components/UserSettings/Appearance"
import ChangePassword from "../../components/UserSettings/ChangePassword"
import DeleteAccount from "../../components/UserSettings/DeleteAccount"
import UserInformation from "../../components/UserSettings/UserInformation"
import Notification from "../../components/UserSettings/Notification.tsx";
import ProfileVisibility from "../../components/UserSettings/ProfileVisibility.tsx";
import RenterPreferences from "../../components/UserSettings/RenterPreferences";

const tabsConfig = [
  { title: "My Profile", component: UserInformation },
  { title: "Security", component: ChangePassword},
  { title: "Profile Visibility", component: ProfileVisibility },
  { title: "Notification", component: Notification },
  { title: "System Settings", component: Appearance },
  { title: "Delete Account", component: DeleteAccount },
  { title: "Renter Preferences", component: RenterPreferences },
]

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

function UserSettings() {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const finalTabs = currentUser?.is_superuser
    ? tabsConfig.slice(0, 7)
    : tabsConfig

  return (
    <Container maxW="full" p={4}>
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} p={4}>
        User Settings
      </Heading>
      <Tabs variant="enclosed" p={2}>
        <TabList>
          {finalTabs.map((tab, index) => (
            <Tab key={index}>{tab.title}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {finalTabs.map((tab, index) => (
            <TabPanel key={index}>
              <tab.component />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Container>
  )
}
