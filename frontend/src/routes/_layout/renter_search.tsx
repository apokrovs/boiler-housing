import {
    Box,
    Container, Heading, Stack,
    Text,
    Button, Flex, Card, CardBody, CardHeader, Badge, HStack, CardFooter, VStack, Divider, RadioGroup, Radio, Checkbox,
} from "@chakra-ui/react"
import {createFileRoute} from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import {UsersService} from "../../client";
import {useQuery} from "@tanstack/react-query";
import {useState} from "react";

export const Route = createFileRoute("/_layout/renter_search")({
  component: RenterSearch,
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
      UsersService.readUsers(),
    queryKey: ["renters"],
  }
}
const quiz_items = [
  { label: "Cleanliness", value: "1" },
  { label: "Visitors", value: "2" },
  { label: "Sleep Schedule", value: "3" },
    { label: "Pets", value: "4" },
    { label: "Smoking", value: "5" },
    { label: "Alcohol", value: "6" },
]
function RenterSearch() {
    const {
         data: renters
     } = useQuery({
         ...getRenterQueryOptions(),
         placeholderData: (prevData) => prevData,
     })
    const [query, setQuery] = useState("");

    return (
         <Container maxW="full">
             <Heading padding={5} size="lg" textAlign={{base: "center", md: "left"}} pt={12}>
                 Potential Roommates
             </Heading>
             <input type={"text"}
             placeholder={"Search"}
             className={"search"}
             onChange={(e) => setQuery(e.target.value)}
             style={{
                 marginLeft: '20px',
                padding: '15px',
                fontSize: '16px',
                width: '600px', // adjust width as needed
                height: '40px', // adjust height as needed
             }}/>
             <Heading padding={3} marginX={2} size="sm" textAlign={{base: "center", md: "left"}}>
                 Filtered Search
             </Heading>
              <HStack gap="6" marginX={5} marginBottom={3}>
                {quiz_items.map((quiz_item) => (
                  <Checkbox key={quiz_item.value} value={quiz_item.value}>
                    {quiz_item.label}
                  </Checkbox>
                ))}
                  <Button bgColor={"#CEB888"} size="md">
                      Apply
                  </Button>
              </HStack>
             <Box overflowX="auto" whiteSpace="normal" p={4}>
                 <Flex gap={4} wrap={"wrap"}>
                     {renters?.data.length === 0 ? (
                          <Text textAlign="center" fontSize="lg" color="gray.500">
                             No roommates available
                         </Text>
                     ) :
                         (renters?.data.filter((renter) => renter.full_name?.toLowerCase().includes(query.toLowerCase()) ?? false).map((roommates) => (
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
                                     <Heading size="md" marginTop={1} marginBottom={5}>{roommates.full_name}</Heading>
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
                     )))}
                 </Flex>
             </Box>
         </Container>
     )
}