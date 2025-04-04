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
  useDisclosure,
  VStack,
  Image,
  IconButton,
  useColorModeValue
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router";
import AddListing from "../../components/Listings/AddListing.tsx";
import Navbar from "../../components/Common/Navbar.tsx";
import { ListingPublic, ListingsService } from "../../client";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import Delete from "../../components/Common/DeleteAlert.tsx";
import EditListing from "../../components/Listings/EditListing.tsx";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import LeaseAgreementViewer from "../../components/Listings/LeaseAgreementViewer.tsx";

export const Route = createFileRoute("/_layout/listings")({
  component: Listings,
})

function getListingsQueryOptions() {
  return {
    queryFn: () =>
      ListingsService.readListings({ skip: 0, limit: 50 }),
    queryKey: ["listings"]
  }
}

// Image Slideshow Component
function ImageSlideshow({ images }: { images: any[] }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const arrowBgColor = useColorModeValue("whiteAlpha.700", "blackAlpha.700");

  const goToNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) {
    return (
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
    );
  }

  const currentImage = images[currentImageIndex];

  return (
    <Box position="relative" width="100%" height="100%">
      <Image
        src={`${import.meta.env.VITE_API_URL}/uploads/${currentImage.file_path}`}
        alt={`Listing image ${currentImageIndex + 1}`}
        objectFit="contain"
        width="100%"
        height="100%"
        maxH="200px"
        bg="gray.50"
      />

      {images.length > 1 && (
        <>
          <IconButton
            aria-label="Previous image"
            icon={<ChevronLeftIcon boxSize={6} />}
            size="sm"
            position="absolute"
            left={2}
            top="50%"
            transform="translateY(-50%)"
            rounded="full"
            bg={arrowBgColor}
            _hover={{ bg: "blackAlpha.800", color: "white" }}
            onClick={goToPrevImage}
          />
          <IconButton
            aria-label="Next image"
            icon={<ChevronRightIcon boxSize={6} />}
            size="sm"
            position="absolute"
            right={2}
            top="50%"
            transform="translateY(-50%)"
            rounded="full"
            bg={arrowBgColor}
            _hover={{ bg: "blackAlpha.800", color: "white" }}
            onClick={goToNextImage}
          />
          <Badge
            position="absolute"
            bottom={2}
            right={2}
            bg={arrowBgColor}
            px={2}
            borderRadius="md"
          >
            {currentImageIndex + 1} / {images.length}
          </Badge>
        </>
      )}
    </Box>
  );
}

function Listings() {
  const editListingModal = useDisclosure()
  const deleteModal = useDisclosure()
  const leaseModal = useDisclosure();
  const [deleteListingId, setDeleteListingId] = React.useState<string | null>(null)
  const [editListing, setEditListing] = React.useState<ListingPublic | null>(null)
  const [leaseFileUrl, setLeaseFileUrl] = React.useState("");
  const [leaseFileName, setLeaseFileName] = React.useState("");

  const handleDeleteClick = (id: string) => {
    setDeleteListingId(id)
    deleteModal.onOpen()
  }

  const handleEditClick = (listing: ListingPublic) => {
    setEditListing(listing)
    editListingModal.onOpen()
  }

  // Opens the lease agreement viewer modal
  const handleViewLease = (leaseAgreement: any) => {
    const url = `${import.meta.env.VITE_API_URL}/uploads/${leaseAgreement.file_path}`;
    setLeaseFileUrl(url);
    setLeaseFileName(leaseAgreement.filename);
    leaseModal.onOpen();
  };

  const {
    data: listings
  } = useQuery({
    ...getListingsQueryOptions(),
    placeholderData: (prevData) => prevData,
  })

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        My Listings
      </Heading>
      <Navbar type={"Listing"} addModalAs={AddListing} />
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
                  <ImageSlideshow images={listing.images || []} />
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
                    <Text fontSize="sm" whiteSpace="normal" wordBreak="break-word">
                      {listing.realty_company}
                    </Text>
                    <HStack spacing={2}>
                      <Badge colorScheme="blue">{listing.num_bedrooms}</Badge>
                      <Badge colorScheme="purple">{listing.num_bathrooms} Bath</Badge>
                    </HStack>
                    <Text fontWeight="bold">
                      Rent: ${listing.rent?.toLocaleString()}
                    </Text>
                    <Text fontSize="sm">
                      Security Deposit: {listing.security_deposit ? `$${listing.security_deposit}` : "None"}
                    </Text>
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
                    <Text fontSize="sm">
                      Lease: {listing.lease_start_date} → {listing.lease_end_date}
                    </Text>
                    {/* Button to view lease agreement if uploaded */}
                    {listing.lease_agreement && (
                      <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={() => handleViewLease(listing.lease_agreement)}
                      >
                        View Lease Agreement
                      </Button>
                    )}
                  </VStack>
                </CardBody>
                <Divider />
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
      {deleteListingId && (
        <Delete
          type="Listing"
          id={deleteListingId}
          isOpen={deleteModal.isOpen}
          onClose={deleteModal.onClose}
        />
      )}
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
      <LeaseAgreementViewer
        isOpen={leaseModal.isOpen}
        onClose={leaseModal.onClose}
        fileUrl={leaseFileUrl}
        fileName={leaseFileName}
      />
    </Container>
  )
}

export default Listings;
