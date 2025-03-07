import { Outlet } from "@tanstack/react-router"
import AutoLogout from "./hooks/autoLogout"

export default function RootLayout() {
  return (
    <>
      <AutoLogout />
      <Outlet />
    </>
  )
}
