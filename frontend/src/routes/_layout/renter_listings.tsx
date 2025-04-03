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
    TabPanel, Image
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router";
import { ConversationCreate, ListingPublic, ListingsService, MessagesService, UsersService } from "../../client";
import { useQuery } from "@tanstack/react-query";
import { createEvent } from "ics";
import { IconButton } from "@chakra-ui/react";
import { FaHeart, FaBookmark, FaComment } from "react-icons/fa";
import { useEffect, useState } from "react";
import {
    closeWebSocketConnection,
    createWebSocketConnection,
    sendChatMessage,
    subscribeToMessageType
} from "../../components/Chat/websocket.tsx";
import useAuth from "../../hooks/useAuth.ts";
import {useQueryClient} from "@tanstack/react-query";

export const Route = createFileRoute("/_layout/renter_listings")({
    component: RenterListings,
})


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
        return;
    }
    const {
        data: saved_listings,
    } = useQuery(getSavedListingsQuery(user));

    const [_error, setError] = useState<string | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const toast = useToast();
    const [savedListings, setSavedListings] = useState<Set<string>>(new Set())
    const queryClient = useQueryClient();

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
            // @ts-ignore
            await queryClient.invalidateQueries(["saved_listings", user?.id, user?.saved_listings]);

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

        // Subscribe to connection close events
        const unsubscribeClose = subscribeToMessageType('connection_close', (data) => {

            // Only show error for abnormal closures
            if (data.code !== 1000 && data.code !== 1008) {
                setError('Connection lost. Please refresh the page to reconnect.');
            }
        });

        // Subscribe to error events
        const unsubscribeError = subscribeToMessageType('connection_error', () => {
            setError('WebSocket error occurred');
        });

        // Clean up on unmount
        return () => {
            closeWebSocketConnection();
            unsubscribeOpen();
            unsubscribeClose();
            unsubscribeError();
        };
    }, [user, toast]);

    const formatToCalendarDate = (dateStr: string): string => {
        const clean = dateStr.replace(/"/g, '');
        // all day event
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
        // YYYY-MM-DD
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
                        {/* All Listings Tab */}
                        <TabPanel>
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
                                                                                            src={`${import.meta.env.VITE_API_URL}/uploads/${img.file_path}`}
                                                                                            alt={listing.address || "Image"}
                                                                                            objectFit="cover"
                                                                                            width="100%"
                                                                                            height="100%"
                                                                                            alignItems="center"
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
                                                                <Text fontSize="sm" whiteSpace="normal"
                                                                      wordBreak="break-word">
                                                                    {listing.realty_company}
                                                                </Text>


                                                                {/* Bedrooms & Bathrooms */}
                                                                <HStack spacing={2}>
                                                                    <Badge colorScheme="blue">{listing.num_bedrooms}</Badge>
                                                                    <Badge
                                                                            colorScheme="purple">{listing.num_bathrooms} Bath</Badge>
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
                                                                                        <Badge key={utility}
                                                                                               colorScheme="green">
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
                                                                                        <Badge key={amenity}
                                                                                               colorScheme="pink">
                                                                                            {amenity}
                                                                                        </Badge>
                                                                                ))}
                                                                            </HStack>
                                                                        </Box>
                                                                )}


                                                                {/* Lease Period */}
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
                                                                                        onClick={() => handleGoogleExport(listing.lease_start_date ?? ""
                                                                                                , listing.lease_end_date ?? "")}>Export
                                                                                    to
                                                                                    Google</MenuItem>
                                                                                <MenuItem
                                                                                        onClick={() => handleICSExport(listing.lease_start_date ?? ""
                                                                                                , listing.lease_end_date ?? "")}>Export
                                                                                    to
                                                                                    iCal</MenuItem>


                                                                                <MenuItem
                                                                                        onClick={() => handleOutlookExport(
                                                                                                listing.lease_start_date ?? ""
                                                                                                , listing.lease_end_date ?? "")}>Export
                                                                                    to
                                                                                    Outlook</MenuItem>
                                                                            </>


                                                                        </MenuList>
                                                                    </Portal>
                                                                </Menu>
                                                            </VStack>
                                                            <HStack spacing={4} mt={4} justifyContent="center">
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
                                                                        onClick={() => toggleSaveListing(listing.id)}

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
                                            ))
                                    )}
                                </Flex>
                            </Box>
                        </TabPanel>
                        {/* Saved Listings Tab */}
                        <TabPanel>
                            <Box overflowX="auto" whiteSpace="nowrap" p={4}>
                                <Flex gap={4}>
                                    {saved_listings?.data.length === 0 ? (
                                            <Text textAlign="center" fontSize="lg" color="gray.500">
                                                You have no saved listings
                                            </Text>
                                    ) : (
                                            saved_listings?.data.map((listing: ListingPublic) => (
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
                                                                                            src={`${import.meta.env.VITE_API_URL}/uploads/${img.file_path}`}
                                                                                            alt={listing.address || "Image"}
                                                                                            objectFit="cover"
                                                                                            width="100%"
                                                                                            height="100%"
                                                                                            alignItems="center"
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
                                                                <Text fontSize="sm" whiteSpace="normal"
                                                                      wordBreak="break-word">
                                                                    {listing.realty_company}
                                                                </Text>


                                                                {/* Bedrooms & Bathrooms */}
                                                                <HStack spacing={2}>
                                                                    <Badge colorScheme="blue">{listing.num_bedrooms}</Badge>
                                                                    <Badge
                                                                            colorScheme="purple">{listing.num_bathrooms} Bath</Badge>
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
                                                                                        <Badge key={utility}
                                                                                               colorScheme="green">
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
                                                                                        <Badge key={amenity}
                                                                                               colorScheme="pink">
                                                                                            {amenity}
                                                                                        </Badge>
                                                                                ))}
                                                                            </HStack>
                                                                        </Box>
                                                                )}


                                                                {/* Lease Period */}
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
                                                                                        onClick={() => handleGoogleExport(listing.lease_start_date ?? ""
                                                                                                , listing.lease_end_date ?? "")}>Export
                                                                                    to
                                                                                    Google</MenuItem>
                                                                                <MenuItem
                                                                                        onClick={() => handleICSExport(listing.lease_start_date ?? ""
                                                                                                , listing.lease_end_date ?? "")}>Export
                                                                                    to
                                                                                    iCal</MenuItem>


                                                                                <MenuItem
                                                                                        onClick={() => handleOutlookExport(
                                                                                                listing.lease_start_date ?? ""
                                                                                                , listing.lease_end_date ?? "")}>Export
                                                                                    to
                                                                                    Outlook</MenuItem>
                                                                            </>


                                                                        </MenuList>
                                                                    </Portal>
                                                                </Menu>
                                                            </VStack>
                                                            <HStack spacing={4} mt={4} justifyContent="center">
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
                                                                        onClick={() => toggleSaveListing(listing.id)}
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
                                            ))
                                    )}
                                </Flex>
                            </Box>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Container>
    )
}

