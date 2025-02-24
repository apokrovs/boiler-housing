import {useState} from "react";

import {Container, FormControl, FormLabel, Heading, Input, Stack} from "@chakra-ui/react"

const RenterPreferences = () => {
    const [currAddress, setCurrAddress] = useState("")
    const [currRealtyCompany, setRealtyCompany] = useState("")
    //const [currRent, setRent] = useState("")
    //const [currMonthlyFee, setMonthlyFee] = useState("")
    //const [currUtilities, setUtilities] = useState("")
    //const [currSecurityDeposit, setSecurityDeposit] = useState("")
    //const [currFurnished, setFurnished] = useState("")
    //const [currLaundry, setLaundry] = useState("")
    //const [currParking, setParking] = useState("")
    //const [currBalcony, setBalcony] = useState("")
    //const [currLeaseDates, setLeaseDates] = useState("")

    return (
        <Container maxW="lg" mt={8}>
            <Heading size="lg" mb={6}>
                Apartment Search Preferences
            </Heading>
            <Stack spacing={4} mb={6}>
                <FormControl>
                    <FormLabel>Address</FormLabel>
                    <Input
                        type="text"
                        value={currAddress}
                        onChange={(e) => setCurrAddress(e.target.value)}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Realty Company</FormLabel>
                    <Input
                        type="text"
                        value={currRealtyCompany}
                        onChange={(e) => setRealtyCompany(e.target.value)}
                    />
                </FormControl>
            </Stack>
        </Container>
    )
}
export default RenterPreferences

