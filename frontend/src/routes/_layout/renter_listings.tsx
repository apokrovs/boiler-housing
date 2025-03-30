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
    Portal
} from "@chakra-ui/react"
import {createFileRoute} from "@tanstack/react-router";
import {ListingsService} from "../../client";
import {useQuery} from "@tanstack/react-query";
import {createEvent} from "ics";

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


function RenterListings() {
    const {
        data: listings
    } = useQuery({
        ...getListingsQueryOptions(),
        placeholderData: (prevData) => prevData,
    })


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


    return (
        <Container maxW="full">
            <Heading size="lg" textAlign={{base: "center", md: "left"}} pt={12}>
                Listings
            </Heading>
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
                                                                , listing.lease_end_date ?? "")}>Export to
                                                            Google</MenuItem>
                                                        <MenuItem
                                                            onClick={() => handleICSExport(listing.lease_start_date ?? ""
                                                                , listing.lease_end_date ?? "")}>Export to
                                                            iCal</MenuItem>


                                                        <MenuItem
                                                            onClick={() => handleOutlookExport(
                                                                listing.lease_start_date ?? ""
                                                                , listing.lease_end_date ?? "")}>Export to
                                                            Outlook</MenuItem>
                                                    </>


                                                </MenuList>
                                            </Portal>
                                        </Menu>
                                    </VStack>
                                </CardBody>
                            </Card>
                        ))
                    )}
                </Flex>
            </Box>
        </Container>
    )
}

