import { ChakraProvider } from "@chakra-ui/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { //createRouter,
    RouterProvider,} from "@tanstack/react-router"
import { createRoot } from "react-dom/client"
//import {routeTree} from "./routeTree.gen.ts"
import { router } from "./router.tsx"

import { StrictMode } from "react"
import { OpenAPI } from "./client"
import theme from "./theme"

OpenAPI.BASE = import.meta.env.VITE_API_URL
OpenAPI.TOKEN = async () => {
  return localStorage.getItem("access_token") || ""
}

const queryClient = new QueryClient()

//const router = createRouter({ routeTree })
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router}/>
      </QueryClientProvider>
    </ChakraProvider>
  </StrictMode>,
)
