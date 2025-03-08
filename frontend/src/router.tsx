import { routeTree } from "./routeTree.gen.ts"
import { createRouter } from "@tanstack/react-router"
import RootLayout from "./RootLayout"

routeTree.update({
  component: RootLayout,
})

export const router = createRouter({
  routeTree,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
