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
import {useState, useEffect} from "react";
import useAuth from "../../hooks/useAuth.ts";

export const Route = createFileRoute("/_layout/renter_search")({
  component: RenterSearch,
})

function getRenterQueryOptions() {
  return {
    queryFn: () =>
      UsersService.readRenters(),
    queryKey: ["renters"],
  }
}

// Define score fields and their display names
const scoreFields = [
  { label: "Cleanliness", field: "cleanScore" },
  { label: "Visitors", field: "visitScore" },
  { label: "Sleep Schedule", field: "sleepTime" },
  { label: "Pets", field: "pets" },
  { label: "Smoking", field: "smoking" },
  { label: "Alcohol", field: "alcoholScore" }
]

function RenterSearch() {
    const {
        data: renters,
        isLoading: rentersLoading
    } = useQuery({
        ...getRenterQueryOptions(),
        placeholderData: (prevData) => prevData,
    })

    const { user: currentUser } = useAuth()

    const [query, setQuery] = useState("");
    const [selectedFilters, setSelectedFilters] = useState([]);
    const [filteredRoommates, setFilteredRoommates] = useState([]);
    const [isFiltersApplied, setIsFiltersApplied] = useState(false);

    const handleFilterChange = (field) => {
        setSelectedFilters(prev => {
            if (prev.includes(field)) {
                return prev.filter(item => item !== field);
            } else {
                return [...prev, field];
            }
        });
        setIsFiltersApplied(false);
    };

    // Apply filters
    const applyFilters = () => {
        if (!renters?.data || !currentUser) return;

        const filtered = renters.data.filter((renter) => {
            // search bar
            const matchesQuery = renter.full_name?.toLowerCase().includes(query.toLowerCase()) ?? false;

            if (!matchesQuery) return false;

            if (selectedFilters.length === 0) if (renter.id === currentUser?.id) return false;

            return selectedFilters.every((fieldName) => {
                console.log("here! " + fieldName)
                switch (fieldName) {
                case 'cleanScore':
                    if (currentUser?.cleanScore == null || renter.cleanScore == null) return false;
                    if (renter.id === currentUser?.id) return false;
                    return renter.cleanScore === currentUser?.cleanScore;
                case 'visitScore':
                    if (currentUser?.visitScore == null || renter.visitScore == null) return false;
                    if (renter.id === currentUser?.id) return false;
                    return renter.visitScore === currentUser.visitScore;
                case 'sleepTime':
                    console.log("here!!!!")
                    if (currentUser?.sleepTime == null || renter.sleepTime == null) return false;
                    if (renter.id === currentUser?.id) return false;
                    console.log(currentUser?.sleepTime)
                    console.log(renter.sleepTime)
                    return renter.sleepTime === currentUser?.sleepTime;
                case 'pets':
                    if (currentUser?.pets == null || renter.pets == null) return false;
                    if (renter.id === currentUser?.id) return false;
                    return renter.pets === currentUser?.pets;
                case 'smoking':
                    if (currentUser?.smoking == null || renter.smoking == null) return false;
                    if (renter.id === currentUser?.id) return false;
                    return renter.smoking === currentUser?.smoking;
                case 'alcoholScore':
                    console.log("alc score")
                    console.log(currentUser?.alcoholScore)
                    console.log(renter.alcoholScore)
                    console.log(renter.full_name)
                    if (currentUser?.alcoholScore == null || renter.alcoholScore == null) return false;
                    if (renter.id === currentUser?.id) return false;
                    return renter.alcoholScore === currentUser?.alcoholScore;
                default:
                    if (renter.id === currentUser?.id) return false;
                    return true;
                }
            });
        });

        setFilteredRoommates(filtered);
        setIsFiltersApplied(true);
    };

    useEffect(() => {
    if (renters?.data) {
        const filtered = renters.data.filter(renter => {
            // exclude themselves
            if (currentUser?.id === renter.id) return false;

            // if query is empty, show all users
            if (!query.trim()) return true;

            return renter.full_name?.toLowerCase().includes(query.toLowerCase()) ?? false;
        });

        console.log("Filtered users count:", filtered.length);
        setFilteredRoommates(filtered);
        setIsFiltersApplied(false);
    }
}, [renters, query]);
    // Loading state
    if (rentersLoading) {
        return <Container maxW="full"><Text p={5}>Loading roommates...</Text></Container>;
    }

    return (
        <Container maxW="full">
            <Heading padding={5} size="lg" textAlign={{base: "center", md: "left"}} pt={12}>
                Potential Roommates
            </Heading>
            <input type={"text"}
                placeholder={"Search by name"}
                className={"search"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                    marginLeft: '20px',
                    padding: '15px',
                    fontSize: '16px',
                    width: '600px',
                    height: '40px',
                }}
            />
            <Heading padding={3} marginX={2} size="sm" textAlign={{base: "center", md: "left"}}>
                Filtered Search
            </Heading>
            <HStack gap="6" marginX={5} marginBottom={3}>
                {scoreFields.map((item) => (
                    <Checkbox
                        key={item.field}
                        value={item.field}
                        isChecked={selectedFilters.includes(item.field)}
                        onChange={() => handleFilterChange(item.field)}
                    >
                        {item.label}
                    </Checkbox>
                ))}
                <Button
                    bgColor={"#CEB888"}
                    size="md"
                    onClick={applyFilters}
                >
                    Apply
                </Button>
            </HStack>

            {selectedFilters.length > 0 && !currentUser && (
                <Text color="red.500" ml={5} mb={3}>
                    Score matching requires your profile to be complete
                </Text>
            )}


            <Box overflowX="auto" whiteSpace="normal" p={4}>
                <Flex gap={4} wrap={"wrap"}>
                    {!filteredRoommates || filteredRoommates.length === 0 ? (
                        <Text textAlign="center" fontSize="lg" color="gray.500" width="100%">
                            {isFiltersApplied ?
                                "No roommates match your selected score criteria" :
                                "No roommates found matching your search"}
                        </Text>
                    ) : (
                        filteredRoommates.map((roommate) => (
                            <Card
                                key={roommate.id}
                                width="300px"
                                size="lg"
                                border="1px solid"
                                borderColor="gray.200"
                                overflow="hidden"
                                flexShrink={0}
                            >
                                <CardBody marginTop={0}>
                                    <VStack align="start" spacing={1}>
                                        <Heading size="md" marginTop={1} marginBottom={5}>{roommate.full_name}</Heading>
                                        {/* renter contact information */}
                                        <Text fontSize="sm" fontWeight={"bold"}>Contact Information:</Text>
                                        <Text fontSize="sm">
                                            {roommate.phone_number}
                                        </Text>
                                        <Text fontSize="sm">
                                            {roommate.email}
                                        </Text>
                                        <Text fontSize="sm" fontWeight={"bold"} marginTop={5}>Bio:</Text>
                                        {/* renter bio */}
                                        <Text fontSize="sm" wordBreak="break-word" whiteSpace="pre-wrap">
                                            {roommate.bio}
                                        </Text>
                                    </VStack>
                                </CardBody>
                                <Divider/>
                                <CardFooter justifyContent="flex-end" padding={3}>
                                    <Button as={Link} to={`/chat`} bgColor={"#CEB888"} size="md">
                                        Send Message
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </Flex>
            </Box>
        </Container>
    )
}