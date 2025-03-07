import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import {useState
  //, useRef,
  //useEffect
} from "react"

import {AxiosError} from "axios"
import {
    type Body_login_login_access_token as AccessToken,
    type ApiError,
    LoginService,
    type UserPublic,
    type UserRegister,
    UsersService,
} from "../client"
import useCustomToast from "./useCustomToast"

const isLoggedIn = () => {
  return localStorage.getItem("access_token") !== null
}

export interface PinLogin {
    email: string;
    pin: string;
}

const useAuth = () => {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const showToast = useCustomToast()
  const queryClient = useQueryClient()
  const { data: user, isLoading } = useQuery<UserPublic | null, Error>({
    queryKey: ["currentUser"],
    queryFn: UsersService.readUserMe,
    enabled: isLoggedIn(),
  })
  // @ts-ignore
  const logout_time = (user?.auto_logout ?? 30)* 60 * 1000

  const signUpMutation = useMutation({
    mutationFn: (data: UserRegister) =>
      UsersService.registerUser({ requestBody: data }),

    onSuccess: () => {
      navigate({ to: "/login" })
      showToast(
        "Account created.",
        "Your account has been created successfully.",
        "success",
      )
    },
    onError: (err: ApiError) => {
      let errDetail = (err.body as any)?.detail

      if (err instanceof AxiosError) {
        errDetail = err.message
      }

      showToast("Something went wrong.", errDetail, "error")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const login = async (data: AccessToken) => {
    const response = await LoginService.loginAccessToken({
      formData: data,
    })
    localStorage.setItem("access_token", response.access_token)
  }

  const loginWithPin = async (data: PinLogin) => {
        const response = await LoginService.loginAccessTokenPin({
            email: data.email,
            pin: data.pin
        });
        localStorage.setItem("access_token", response.access_token);
    };

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate({ to: "/" })
    },
    onError: (err: ApiError) => {
      let errDetail = (err.body as any)?.detail

      if (err instanceof AxiosError) {
        errDetail = err.message
      }

      if (Array.isArray(errDetail)) {
        errDetail = "Something went wrong"
      }

      setError(errDetail)
    },
  })

  const loginWithPinMutation = useMutation({
    mutationFn: loginWithPin,
    onSuccess: () => {
      navigate({ to: "/" });
    },
    onError: (err: ApiError) => {
      let errDetail = (err.body as any)?.detail;

      if (err instanceof AxiosError) {
        errDetail = err.message;
      }

      if (Array.isArray(errDetail)) {
        errDetail = "Something went wrong";
      }

      setError(errDetail);
    },
  })

  const logout = () => {
    localStorage.removeItem("access_token")
    navigate({ to: "/login" })
  }

  // leaving this commented in for a bit just in case

/*  const timerID = useRef<NodeJS.Timeout | null>(null)

  const logout_timer_reset = () => {
    if (timerID.current) {
      clearTimeout(timerID.current)
    }
    timerID.current = setTimeout(() => {
      logout()
    }, logout_time)
  }

  useEffect(() => {
    if (location.pathname ===  "/signup") {
      return
    }
    if (localStorage.getItem("access_token")) {
      logout_timer_reset()

      const handleActivity = () => {
        logout_timer_reset()
      }
      window.addEventListener("mousemove", handleActivity)
      if(timerID.current) {
        clearTimeout(timerID.current)
      }
    }
  }, [user?.auto_logout]);*/

  return {
    signUpMutation,
    loginMutation,
    loginWithPinMutation,
    logout,
    user,
    isLoading,
    error,
    resetError: () => setError(null),
  }
}

export { isLoggedIn }
export default useAuth
