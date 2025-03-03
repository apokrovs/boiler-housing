import { Chat } from '../../components/Chat/Chat';
import { createFileRoute } from "@tanstack/react-router"
import {z} from "zod";


const chatSearchSchema = z.object({
  page: z.number().catch(1),
})

export const Route = createFileRoute("/_layout/chat")({
  component: () => <Chat />,
  validateSearch: (search) => chatSearchSchema.parse(search),
});
