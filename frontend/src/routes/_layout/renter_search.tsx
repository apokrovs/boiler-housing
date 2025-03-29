import {
    Box,
    Container, Heading, Stack,
    Text,
    Button, Flex, Card, CardBody, CardHeader, Badge, HStack, CardFooter, VStack, Divider,
} from "@chakra-ui/react"
import {createFileRoute} from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import {UsersService} from "../../client";
import {useQuery} from "@tanstack/react-query";

export const Route = createFileRoute("/_layout/renter_search")({
  component: Dashboard,
})

// const roommates = [
//     {
//         id: 1,
//         name: "Lynn Nakamura",
//         email: "lnakamur@purdue.edu",
//         phone: "14696555208",
//         bio: "Hello my name is Lynn and I am rising junior in CS. I like to play volleyball. I am interested in 3 other roommates",
//     },
//     {
//         id: 2,
//         name: "Himaja Narajala",
//         email: "hnarajal@purdue.edu",
//         phone: "14696555208",
//         bio: "Junior in CS",
//     }
// ]
function getRenterQueryOptions() {
  return {
    queryFn: () =>
      UsersService.readUsers({skip: 0, limit: 50}),
    queryKey: ["renters"],
  }
}
function Dashboard() {
    const {
         data: renters
     } = useQuery({
         ...getRenterQueryOptions(),
         placeholderData: (prevData) => prevData,
     })
    return (
         <Container maxW="full">
             <Heading padding={5} size="lg" textAlign={{base: "center", md: "left"}} pt={12}>
                 Potential Roommates
             </Heading>
             <Box overflowX="auto" whiteSpace="normal" p={4}>
                 <Flex gap={4} wrap={"wrap"}>
                     {renters?.data.map((roommates) => (
                         <Card
                             key={roommates.id}
                             width="300px"
                             size="lg"
                             border="1px solid"
                             borderColor="gray.200"
                             overflow="hidden"
                             flexShrink={0}
                         >
                             <CardBody marginTop={0}>
                                 <VStack align="start" spacing={1}>
                                     <Heading size="md" marginTop={1} marginBottom={5}>{roommates.name}</Heading>
                                     {/* renter contact information */}
                                     <Text fontSize="sm" fontWeight={"bold"}>Contact Information:</Text>
                                     <Text fontSize="sm">
                                         {roommates.phone_number}
                                     </Text>
                                     <Text fontSize="sm">
                                         {roommates.email}
                                     </Text>
                                     <Text fontSize="sm" fontWeight={"bold"} marginTop={5}>Bio:</Text>
                                     {/* renter bio */}
                                     <Text fontSize="sm" wordBreak="break-word" whiteSpace="pre-wrap">
                                         {roommates.bio}
                                     </Text>
                                 </VStack>
                             </CardBody>
                             <Divider/>
                             <CardFooter justifyContent="flex-end" padding={3}>
                                 <Button as={Link} to="/chat" bgColor={"#CEB888"} size="md">
                                     Send Message
                                 </Button>
                             </CardFooter>
                         </Card>
                     ))}
                 </Flex>
             </Box>
         </Container>
     )
}
