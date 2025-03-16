import {
    Badge,
    Box,
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Container,
    Divider,
    Flex,
    Heading,
    HStack,
    Text,
    VStack
} from "@chakra-ui/react"
import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/listings")({
    component: Listings,
})

const listings = [
    {
        id: 1,
        address: '123 Main St, Springfield',
        num_bedrooms: '2',
        num_bathrooms: '1',
        rent: 1200,
        security_deposit: '1200',
        realty_company: 'Dream Homes Realty',
        included_utilities: ['Water', 'Trash'],
        amenities: ['Pool', 'Gym'],
        lease_start_date: '2025-06-01',
        lease_end_date: '2026-06-01',
    },
    {
        id: 2,
        address: '456 Oak Ave, Metropolis',
        num_bedrooms: '3',
        num_bathrooms: '2',
        rent: 1800,
        security_deposit: '1800',
        realty_company: 'Urban Living LLC',
        included_utilities: ['Gas', 'Internet'],
        amenities: ['Rooftop', 'Doorman'],
        lease_start_date: '2025-07-01',
        lease_end_date: '2026-07-01',
    },
];

function Listings() {
    return (
        <Container maxW="full">
            <Heading size="lg" textAlign={{base: "center", md: "left"}} pt={12}>
                My Listings
            </Heading>
            <Box overflowX="auto" whiteSpace="nowrap" p={4}>
                <Flex gap={4}>
                    {listings.map((listing) => (
                        <Card
                            key={listing.id}
                            width="300px"
                            size="lg"
                            border="1px solid"
                            borderColor="gray.200"
                            overflow="hidden"
                            flexShrink={0}
                        >
                            <CardHeader>
                                <Heading size="md">{listing.address}</Heading>
                            </CardHeader>
                            <CardBody>
                                <VStack align="start" spacing={2}>
                                    {/* Realty Company */}
                                    <Text fontSize="sm">
                                        {listing.realty_company}
                                    </Text>

                                    {/* Bedrooms & Bathrooms */}
                                    <HStack spacing={2}>
                                        <Badge colorScheme="blue">{listing.num_bedrooms} Bed</Badge>
                                        <Badge colorScheme="purple">{listing.num_bathrooms} Bath</Badge>
                                    </HStack>

                                    {/* Rent & Security Deposit */}
                                    <Text fontWeight="bold">
                                        Rent: ${listing.rent?.toLocaleString()}
                                    </Text>
                                    <Text fontSize="sm">
                                        Security Deposit: ${listing.security_deposit}
                                    </Text>

                                    {/* Included Utilities */}
                                    {listing.included_utilities && (
                                        <Box>
                                            <Text fontSize="sm" fontWeight="semibold">
                                                Utilities:
                                            </Text>
                                            <HStack spacing={1}>
                                                {listing.included_utilities.map((utility) => (
                                                    <Badge key={utility} colorScheme="green">
                                                        {utility}
                                                    </Badge>
                                                ))}
                                            </HStack>
                                        </Box>
                                    )}

                                    {/* Amenities */}
                                    {listing.amenities && (
                                        <Box>
                                            <Text fontSize="sm" fontWeight="semibold">
                                                Amenities:
                                            </Text>
                                            <HStack spacing={1}>
                                                {listing.amenities.map((amenity) => (
                                                    <Badge key={amenity} colorScheme="pink">
                                                        {amenity}
                                                    </Badge>
                                                ))}
                                            </HStack>
                                        </Box>
                                    )}

                                    {/* Lease Period */}
                                    <Text fontSize="sm">
                                        Lease: {listing.lease_start_date} → {listing.lease_end_date}
                                    </Text>
                                </VStack>
                            </CardBody>
                            <Divider/>
                            <CardFooter justifyContent="flex-end">
                                <Button colorScheme="blue" size="sm">
                                    Edit Listing
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </Flex>
            </Box>
        </Container>
    )
}