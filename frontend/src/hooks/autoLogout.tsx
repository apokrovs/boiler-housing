import { useRef, useEffect } from "react"
import useAuth from "./useAuth"

function AutoLogout() {
  const { user, logout } = useAuth()

  const timerId = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logout_time = (user?.auto_logout ?? 30) * 60 * 1000

  const resetLogoutTimer = () => {
    if (timerId.current) {
      clearTimeout(timerId.current)
    }
    timerId.current = setTimeout(() => {
      logout()
    }, logout_time)
  }

  useEffect(() => {
    if (localStorage.getItem("access_token")) {
      resetLogoutTimer()

      const handleActivity = () => {
        resetLogoutTimer()
      }

      window.addEventListener("mousemove", handleActivity)

      return () => {
        window.removeEventListener("mousemove", handleActivity)
        if (timerId.current) {
          clearTimeout(timerId.current)
        }
      }
    }
  }, [logout_time, logout])

  return null
}

export default AutoLogout
