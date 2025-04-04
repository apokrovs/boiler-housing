import {
    Badge,
    Box,
    Card,
    CardBody,
    CardHeader,
    Container,
    Flex,
    Heading,
    HStack,
    Text,
    VStack,
    MenuButton,
    Menu,
    MenuItem,
    MenuList,
    Portal,
    useToast,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Image,
    IconButton,
    useColorModeValue, useDisclosure
} from "@chakra-ui/react"
import {createFileRoute} from "@tanstack/react-router";
import {ConversationCreate, ListingPublic, ListingsService, MessagesService, UsersService} from "../../client";
import {useQuery} from "@tanstack/react-query";
import {createEvent} from "ics";
import {ChevronLeftIcon, ChevronRightIcon} from "@chakra-ui/icons";
import {FaHeart, FaBookmark, FaComment, FaFile} from "react-icons/fa";
import {useEffect, useState} from "react";
import {
    closeWebSocketConnection,
    createWebSocketConnection,
    sendChatMessage,
    subscribeToMessageType
} from "../../components/Chat/websocket.tsx";
import useAuth from "../../hooks/useAuth.ts";
import {useQueryClient} from "@tanstack/react-query";
import LeaseAgreementViewer from "../../components/Listings/LeaseAgreementViewer.tsx";

export const Route = createFileRoute("/_layout/renter_listings")({
    component: RenterListings,
})

// Image Slideshow Component
function ImageSlideshow({images}: { images: any[] }) {
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
                                    icon={<ChevronLeftIcon boxSize={6}/>}
                                    size="sm"
                                    position="absolute"
                                    left={2}
                                    top="50%"
                                    transform="translateY(-50%)"
                                    rounded="full"
                                    bg={arrowBgColor}
                                    _hover={{bg: "blackAlpha.800", color: "white"}}
                                    onClick={goToPrevImage}
                            />
                            <IconButton
                                    aria-label="Next image"
                                    icon={<ChevronRightIcon boxSize={6}/>}
                                    size="sm"
                                    position="absolute"
                                    right={2}
                                    top="50%"
                                    transform="translateY(-50%)"
                                    rounded="full"
                                    bg={arrowBgColor}
                                    _hover={{bg: "blackAlpha.800", color: "white"}}
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

function getListingsQueryOptions() {
    return {
        queryFn: () =>
                ListingsService.readAllListings({skip: 0, limit: 50}),
        queryKey: ["listings"]
    }
}

async function fetchSavedListings(user: { saved_listings?: string[]; id?: string }): Promise<{
    data: ListingPublic[]
}> {
    if (!user?.saved_listings || user.saved_listings.length === 0) {
        return {data: []};
    }
    const listingPromises = user.saved_listings.map((listingId: string) =>
            ListingsService.readListing({id: listingId})
    );
    const listings = await Promise.all(listingPromises);
    return {data: listings};
}

function getSavedListingsQuery(user: { saved_listings?: string[]; id?: string }) {
    return {
        queryKey: ["saved_listings", user?.id, user?.saved_listings],
        queryFn: () => fetchSavedListings(user)
    };
}

interface NewConversationProps {
    onNewConversation?: (conversationId: string, isGroup: boolean, name?: string) => void;
}

function RenterListings({onNewConversation}: NewConversationProps) {
    const {
        data: listings
    } = useQuery({
        ...getListingsQueryOptions(),
        placeholderData: (prevData) => prevData,
    })
    const {user} = useAuth();
    if (!user) {
        return null;
    }
    const {
        data: saved_listings,
    } = useQuery(getSavedListingsQuery(user));

    const [_error, setError] = useState<string | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const toast = useToast();
    const [savedListings, setSavedListings] = useState<Set<string>>(new Set())
    const queryClient = useQueryClient();

    const [leaseFileUrl, setLeaseFileUrl] = useState("");
    const [leaseFileName, setLeaseFileName] = useState("");
    const leaseModal = useDisclosure();

    useEffect(() => {
        if (saved_listings) {
            setSavedListings(new Set(user.saved_listings));
        }
    }, [user?.saved_listings]);

    const toggleSaveListing = async (listingId: string) => {
        const newSavedSet = new Set(savedListings);

        if (newSavedSet.has(listingId)) {
            newSavedSet.delete(listingId);
        } else {
            newSavedSet.add(listingId);
        }
        setSavedListings(newSavedSet);

        try {
            await UsersService.updateSavedListings({
                requestBody: {saved_listings: Array.from(newSavedSet)}
            });
            toast({
                title: "Saved listings updated",
                status: "success",
                duration: 2000,
                isClosable: true,
            });
            await queryClient.invalidateQueries("saved_listings", user?.id, user?.saved_listings);
        } catch (error) {
            toast({
                title: "Error updating saved listings",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            console.error("Error updating saved listings:", error);
        }
    };

    useEffect(() => {
        if (!user) return;

        createWebSocketConnection();

        const unsubscribeOpen = subscribeToMessageType('connection_open', () => {
            setError(null);
        });
        const unsubscribeClose = subscribeToMessageType('connection_close', (data) => {
            if (data.code !== 1000 && data.code !== 1008) {
                setError('Connection lost. Please refresh the page to reconnect.');
            }
        });
        const unsubscribeError = subscribeToMessageType('connection_error', () => {
            setError('WebSocket error occurred');
        });

        return () => {
            closeWebSocketConnection();
            unsubscribeOpen();
            unsubscribeClose();
            unsubscribeError();
        };
    }, [user, toast]);

    const formatToCalendarDate = (dateStr: string): string => {
        const clean = dateStr.replace(/"/g, '');
        return clean.substring(0, 10).replace(/-/g, '');
    }

    function handleGoogleExport(leaseStart: string, leaseEnd: string) {
        const eventTitle = "Lease Period";
        const startTime = formatToCalendarDate(leaseStart)
        const endTime = formatToCalendarDate(leaseEnd)
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                eventTitle
        )}&dates=${startTime}/${endTime}`;
        window.open(googleCalendarUrl, '_blank');
    }

    const parseDateArray = (dateStr: string): [number, number, number] => {
        const clean = dateStr.replace(/"/g, "");
        const date = new Date(clean);
        return [date.getFullYear(), date.getMonth() + 1, date.getDate() + 1];
    };
    const parseDateArrayEnd = (dateStr: string): [number, number, number] => {
        const clean = dateStr.replace(/"/g, "");
        const date = new Date(clean);
        return [date.getFullYear(), date.getMonth() + 1, date.getDate() + 2];
    };

    function handleICSExport(leaseStart: string, leaseEnd: string) {
        const eventTitle = "Lease Period";
        const startTime: [number, number, number] = parseDateArray(leaseStart)
        const endTime: [number, number, number] = parseDateArrayEnd(leaseEnd)
        const eventData = {
            title: eventTitle,
            description: "Boiler Housing lease",
            start: startTime,
            end: endTime,
            location: "",
        }

        createEvent(eventData, (error, value) => {
            if (error) {
                console.error("Error generating ICS file:", error);
                return;
            }
            const blob = new Blob([value], {type: "text/calendar;charset=utf-8"})
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "lease_event.ics";
            a.click();
            URL.revokeObjectURL(url)
        });
    }

    function handleOutlookExport(leaseStart: string, leaseEnd: string) {
        const eventTitle = "Lease Period";
        const startTime = leaseStart.replace(/"/g, "").substring(0, 10);
        const cleanEnd = leaseEnd.replace(/"/g, "").substring(0, 10);
        const endTime = new Date(cleanEnd);
        endTime.setDate(endTime.getDate() + 1);
        const formattedEnd = endTime.toISOString().substring(0, 10);
        const outlookUrl = `https://outlook.office365.com/calendar/action/compose?rru=addevent&subject=${encodeURIComponent(
                eventTitle
        )}&startdt=${encodeURIComponent(startTime)}&enddt=${encodeURIComponent(
                formattedEnd
        )}&allday=true`;

        window.open(outlookUrl, "_blank");
    }

    const handleLike = async (owner_id: string) => {
        const userData = await UsersService.readUserById({userId: owner_id});
        ListingsService.listingLikeEmail({
            email: userData.email,
        })
    }

    const handleSave = async (owner_id: string) => {
        const userData = await UsersService.readUserById({userId: owner_id});
        ListingsService.listingSaveEmail({
            email: userData.email,
        })
    }

    const handleInquiry = async (owner_id: string) => {
        setSelectedUsers([owner_id]);
        if (!user) {
            return;
        }

        const owner = await UsersService.readUserById({userId: owner_id})
        try {
            const conversationData: ConversationCreate = {
                participant_ids: selectedUsers,
                is_group: false,
                name: owner.full_name
            };

            const newConversation = await MessagesService.createConversation({
                requestBody: conversationData
            });

            if (newConversation) {
                if (onNewConversation) {
                    onNewConversation(
                            newConversation.id,
                            newConversation.is_group || false,
                            newConversation.name || undefined
                    );
                }

                const greeting = 'Hello! Let\'s chat!';
                await sendChatMessage(greeting, newConversation.id);
                toast({
                    title: 'Conversation created',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            toast({
                title: 'Error creating conversation',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    }

    // Render card component for each listing
    const renderListingCard = (listing: ListingPublic) => (
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
                    <ImageSlideshow images={listing.images || []}/>
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
                        <Menu placement="bottom">
                            <MenuButton textAlign="center">
                                <Text fontSize="sm">
                                    Lease: {listing.lease_start_date} → {listing.lease_end_date}
                                </Text>
                            </MenuButton>
                            <Portal>
                                <MenuList zIndex="popover">
                                    <>
                                        <MenuItem
                                                onClick={() => handleGoogleExport(listing.lease_start_date ?? "",
                                                        listing.lease_end_date ?? "")}>
                                            Export to Google
                                        </MenuItem>
                                        <MenuItem
                                                onClick={() => handleICSExport(listing.lease_start_date ?? "",
                                                        listing.lease_end_date ?? "")}>
                                            Export to iCal
                                        </MenuItem>
                                        <MenuItem
                                                onClick={() => handleOutlookExport(
                                                        listing.lease_start_date ?? "",
                                                        listing.lease_end_date ?? "")}>
                                            Export to Outlook
                                        </MenuItem>
                                    </>
                                </MenuList>
                            </Portal>
                        </Menu>
                    </VStack>
                    <HStack spacing={4} mt={4} justifyContent="center">
                        {/* Lease agreement icon button */}
                        {listing.lease_agreement && (
                                <IconButton
                                        aria-label="View Lease Agreement"
                                        icon={<FaFile/>}
                                        size="lg"
                                        variant="ghost"
                                        onClick={() => {
                                            const url = `${import.meta.env.VITE_API_URL}/uploads/${listing.lease_agreement!.file_path}`;
                                            setLeaseFileUrl(url);
                                            setLeaseFileName(listing.lease_agreement!.filename as string);
                                            leaseModal.onOpen();
                                        }}
                                />
                        )}

                        <IconButton
                                aria-label="Favorite"
                                icon={<FaHeart/>}
                                fontSize="xl"
                                size="lg"
                                variant={"ghost"}
                                onClick={() => handleLike(listing.owner_id)}
                        />
                        <IconButton
                                aria-label="Save"
                                icon={<FaBookmark/>}
                                size="lg"
                                fontSize="xl"
                                isActive={savedListings.has(listing.id)}
                                colorScheme={savedListings.has(listing.id) ? "yellow" : "gray"}
                                variant={savedListings.has(listing.id) ? "solid" : "ghost"}
                                onClick={() => {
                                    toggleSaveListing(listing.id)
                                    handleSave(listing.owner_id)
                                }}
                        />
                        <IconButton
                                aria-label="Inquiry"
                                icon={<FaComment/>}
                                variant="ghost"
                                size="lg"
                                fontSize="xl"
                                onClick={() => handleInquiry(listing.owner_id)}
                        />
                    </HStack>
                </CardBody>
            </Card>
    );

    return (
            <Container maxW="full">
                <Heading size="lg" textAlign={{base: "center", md: "left"}} pt={12}>
                    Listings
                </Heading>
                <Tabs variant="enclosed" mt={4}>
                    <TabList>
                        <Tab>All Listings</Tab>
                        <Tab>Saved Listings</Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel>
                            <Box overflowX="auto" whiteSpace="nowrap" p={4}>
                                <Flex gap={4}>
                                    {listings?.data.length === 0 ? (
                                            <Text textAlign="center" fontSize="lg" color="gray.500">
                                                No listings available
                                            </Text>
                                    ) : (
                                            listings?.data.map((listing) => renderListingCard(listing))
                                    )}
                                </Flex>
                            </Box>
                        </TabPanel>
                        <TabPanel>
                            <Box overflowX="auto" whiteSpace="nowrap" p={4}>
                                <Flex gap={4}>
                                    {saved_listings?.data.length === 0 ? (
                                            <Text textAlign="center" fontSize="lg" color="gray.500">
                                                You have no saved listings
                                            </Text>
                                    ) : (
                                            saved_listings?.data.map((listing: ListingPublic) => renderListingCard(listing))
                                    )}
                                </Flex>
                            </Box>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
                <LeaseAgreementViewer
                        isOpen={leaseModal.isOpen}
                        onClose={leaseModal.onClose}
                        fileUrl={leaseFileUrl}
                        fileName={leaseFileName}
                />
            </Container>
    )
}

export default RenterListings;