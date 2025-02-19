import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/messaging')({
  component: () => <div>Hello /_layout/messaging!</div>
})