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
    Text, useDisclosure,
    VStack,
    Image
} from "@chakra-ui/react"
import {createFileRoute} from "@tanstack/react-router";
import AddListing from "../../components/Listings/AddListing.tsx";
import Navbar from "../../components/Common/Navbar.tsx";
import {ListingPublic, ListingsService} from "../../client";
import {useQuery} from "@tanstack/react-query";
import React from "react";
import Delete from "../../components/Common/DeleteAlert.tsx";
import EditListing from "../../components/Listings/EditListing.tsx";

export const Route = createFileRoute("/_layout/listings")({
    component: Listings,
})

function getListingsQueryOptions() {
    return {
        queryFn: () =>
                ListingsService.readListings({skip: 0, limit: 50}),
        queryKey: ["listings"]
    }
}

function Listings() {
    const editListingModal = useDisclosure()
    const deleteModal = useDisclosure()
    const [deleteListingId, setDeleteListingId] = React.useState<string | null>(null)
    const [editListing, setEditListing] = React.useState<ListingPublic | null>(null)

    const handleDeleteClick = (id: string) => {
        setDeleteListingId(id)
        deleteModal.onOpen()
    }

    const handleEditClick = (listing: ListingPublic) => {
        setEditListing(listing)
        editListingModal.onOpen()
    }

    const {
        data: listings
    } = useQuery({
        ...getListingsQueryOptions(),
        placeholderData: (prevData) => prevData,
    })

    return (
            <Container maxW="full">
                <Heading size="lg" textAlign={{base: "center", md: "left"}} pt={12}>
                    My Listings
                </Heading>
                <Navbar type={"Listing"} addModalAs={AddListing}/>
                <Box overflowX="auto" whiteSpace="nowrap" p={4}>
                    <Flex gap={4}>
                        {listings?.data.length === 0 ? (
                                <Text textAlign="center" fontSize="lg" color="gray.500">
                                    No listings available
                                </Text>
                        ) : (
                                listings?.data.map((listing) => (
                                        <Card
                                                key={listing.id}
                                                width="300px"
                                                size="lg"
                                                border="1px solid"
                                                borderColor="gray.200"
                                                overflow="hidden"
                                                flexShrink={0}
                                        >
                                            <Box height="200px" position="relative" overflow="hidden">
                                                {listing.images && listing.images.length > 0 ? (
                                                        listing.images
                                                                .filter(img => img.is_primary)
                                                                .map((img, idx) => (
                                                                        <Image
                                                                                key={idx}
                                                                                src={`/uploads/${img.file_path}`}
                                                                                objectFit="cover"
                                                                                width="100%"
                                                                                height="100%"
                                                                        />
                                                                ))
                                                ) : (
                                                        <Box
                                                                bg="gray.100"
                                                                width="100%"
                                                                height="100%"
                                                                display="flex"
                                                                alignItems="center"
                                                                justifyContent="center"
                                                        >
                                                            <Text color="gray.500">No Image</Text>
                                                        </Box>
                                                )}
                                            </Box>
                                            <CardHeader>
                                                <Heading
                                                        size="md"
                                                        whiteSpace="normal"
                                                        wordBreak="break-word"
                                                >
                                                    {listing.address}
                                                </Heading>
                                            </CardHeader>
                                            <CardBody>
                                                <VStack align="start" spacing={2}>
                                                    {/* Realty Company */}
                                                    <Text fontSize="sm" whiteSpace="normal" wordBreak="break-word">
                                                        {listing.realty_company}
                                                    </Text>

                                                    {/* Bedrooms & Bathrooms */}
                                                    <HStack spacing={2}>
                                                        <Badge colorScheme="blue">{listing.num_bedrooms}</Badge>
                                                        <Badge colorScheme="purple">{listing.num_bathrooms} Bath</Badge>
                                                    </HStack>

                                                    {/* Rent & Security Deposit */}
                                                    <Text fontWeight="bold">
                                                        Rent: ${listing.rent?.toLocaleString()}
                                                    </Text>
                                                    <Text fontSize="sm">
                                                        Security
                                                        Deposit: {listing.security_deposit ? `$${listing.security_deposit}` : "None"}
                                                    </Text>

                                                    {/* Included Utilities */}
                                                    {listing.included_utilities && (
                                                            <Box>
                                                                <Text fontSize="sm" fontWeight="semibold">
                                                                    Utilities:
                                                                </Text>
                                                                <HStack wrap="wrap" spacing={1}>
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
                                                                <HStack wrap="wrap" spacing={1}>
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
                                                <HStack width="full" justify="space-between">
                                                    <Button
                                                            colorScheme="blue"
                                                            size="sm"
                                                            onClick={() => handleEditClick(listing)}
                                                    >
                                                        Edit Listing
                                                    </Button>

                                                    <Button
                                                            colorScheme="red"
                                                            size="sm"
                                                            onClick={() => handleDeleteClick(listing.id)}
                                                    >
                                                        Delete Listing
                                                    </Button>
                                                </HStack>
                                            </CardFooter>
                                        </Card>
                                ))
                        )}
                    </Flex>
                </Box>
                {/* Delete Modal */}
                {deleteListingId && (
                        <Delete
                                type="Listing"
                                id={deleteListingId}
                                isOpen={deleteModal.isOpen}
                                onClose={deleteModal.onClose}
                        />
                )}

                {/* Edit Modal */}
                {editListing && (
                        <EditListing
                                listing={editListing}
                                isOpen={editListingModal.isOpen}
                                onClose={() => {
                                    setEditListing(null);
                                    editListingModal.onClose();
                                }}
                        />
                )}
            </Container>
    )
}