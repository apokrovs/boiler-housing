import {useState} from "react";

import {
    Button,
    Checkbox,
    Container,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    HStack,
    Input, Radio, RadioGroup,
    Stack,
    Text, useColorModeValue
} from "@chakra-ui/react"

const RenterPreferences = () => {
    const [currAddress, setAddress] = useState("")
    const [currRealtyCompany, setRealtyCompany] = useState("")
    const [currMinPrice, setMinPrice] = useState("")
    const [currMaxPrice, setMaxPrice] = useState("")
    const [currSecurityDeposit, setSecurityDeposit] = useState("")
    const [currStartDate, setStartDate] = useState("")
    const [currEndDate, setEndDate] = useState("")

     const bgActive = useColorModeValue("#f0eee2", "#68634a")

    return (
        <Container maxW="lg" mt={8}>
            <Heading textAlign="center" size="lg" mb={6}>
                Apartment Search Preferences
            </Heading>
            <Text textAlign="center" fontSize="md" color="#9c956a">
                Here you can specify your search preferences that will automatically update your search! Update your
                notification settings to get notified when a new listing matching these criteria gets posted!
            </Text>
            <Stack spacing={4} mt={4} mb={6}>
                <FormControl>
                    <FormLabel>Bedroom</FormLabel>
                    <FormHelperText mb={2}>Select the number of bedrooms in your listing search.</FormHelperText>
                    <HStack spacing={4}>
                        {["Studio", "1 Bed", "2 Bed", "3+ Bed"].map((label) => (
                            <Checkbox key={label}>
                                {label}
                            </Checkbox>
                        ))}
                    </HStack>
                </FormControl>

                <FormControl>
                    <FormLabel>Bathroom</FormLabel>
                    <FormHelperText mb={2}>Select the number of bathrooms in your listing search.</FormHelperText>
                    <HStack spacing={4}>
                        {["1", "2", "3+"].map((label) => (
                            <Checkbox key={label}>
                                {label} Bath
                            </Checkbox>
                        ))}
                    </HStack>
                </FormControl>

                <FormControl>
                    <FormLabel>Address</FormLabel>
                    <FormHelperText mb={2}>Specify postings for a specific address.</FormHelperText>
                    <Input
                        type="text"
                        placeholder="Street Address"
                        value={currAddress}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Realty Company</FormLabel>
                    <FormHelperText mb={2}>Specify postings for a specific realty company.</FormHelperText>
                    <Input
                        type="text"
                        placeholder="Company Name"
                        value={currRealtyCompany}
                        onChange={(e) => setRealtyCompany(e.target.value)}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Rent</FormLabel>
                    <FormHelperText mb={2}>Select a monthly rent range.</FormHelperText>
                    <HStack spacing={4} align="center">
                        <Input
                            type="number"
                            placeholder="Min Price"
                            value={currMinPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            min="0"
                        />
                        <Text>-</Text>
                        <Input
                            type="number"
                            placeholder="Max Price"
                            value={currMaxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            min="0"
                        />
                    </HStack>
                </FormControl>

                <FormControl>
                    <FormLabel>Included Utilities</FormLabel>
                    <FormHelperText>Select what utilities you would like included in rent.</FormHelperText>
                    <FormHelperText mb={2}>Some landlords may include certain utilities like water, trash, or basic
                        cable in the monthly rent, while others may require separate payments.</FormHelperText>
                    <HStack spacing={4}>
                        {["Water", "Sewage", "Garbage", "Electricity", "Gas", "Internet/Cable"].map((label) => (
                            <Checkbox key={label}>
                                {label}
                            </Checkbox>
                        ))}
                    </HStack>
                </FormControl>

                <FormControl>
                    <FormLabel>Security Deposit</FormLabel>
                    <FormHelperText mb={2}>Select if you would like to include listings with security deposits in your
                        search.</FormHelperText>
                    <RadioGroup defaultValue="no" onChange={setSecurityDeposit} value={currSecurityDeposit}>
                        <Stack direction="row">
                            <Radio value="yes">Yes</Radio>
                            <Radio value="no">No</Radio>
                            <Radio value="noPreference">No Preference</Radio>
                        </Stack>
                    </RadioGroup>
                </FormControl>

                <FormControl>
                    <FormLabel>Amenities</FormLabel>
                    <FormHelperText mb={2}>Select what amenities you would like in your search.</FormHelperText>
                    <HStack spacing={4}>
                        {["Maintenance", "Trash Removal", "Fitness Center", "Pool"].map((label) => (
                            <Checkbox key={label}>
                                {label}
                            </Checkbox>
                        ))}
                    </HStack>
                    <HStack spacing={4}>
                        {["Furnished", "Laundry", "Parking", "Balcony", "Pets"].map((label) => (
                            <Checkbox key={label}>
                                {label}
                            </Checkbox>
                        ))}
                    </HStack>
                </FormControl>

                <FormControl>
                    <FormLabel>Lease Dates</FormLabel>
                    <FormHelperText mb={2}>Select the start and end dates for your preferred lease
                        period.</FormHelperText>
                    <HStack spacing={4}>
                        <Input
                            type="date"
                            value={currStartDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Text>-</Text>
                        <Input
                            type="date"
                            value={currEndDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </HStack>
                </FormControl>

                <Button
                    mt={4}
                    bg={bgActive}
                >
                    Update Preferences
                </Button>
            </Stack>
        </Container>
    )
}
export default RenterPreferences

