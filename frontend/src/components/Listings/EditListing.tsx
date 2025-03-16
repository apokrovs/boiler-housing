import {
    Button,
    Checkbox,
    CheckboxGroup,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Flex,
    FormControl,
    FormLabel,
    HStack,
    Input,
    Select,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Text,
} from '@chakra-ui/react'
import {useState} from "react";

interface EditListingProps {
    isOpen: boolean
    onClose: () => void
}

const EditListing = ({isOpen, onClose}: EditListingProps) => {
    const bedrooms = ['Studio', '1 Bed', '2 Bed', '3+ Bed'];
    const bathrooms = ['1', '2', '3+'];
    const [isSecurityDeposit, setIsSecurityDeposit] = useState(false);
    const utilities = ["Water", "Sewage", "Garbage", "Electricity", "Gas", "Internet/Cable", "Other"];
    const [selectedUtilities, setSelectedUtilities] = useState<string[]>([]);
    const [otherUtility, setOtherUtility] = useState('');
    const amenities = ["Maintenance", "Trash Removal", "Fitness Center", "Pool", "Furnished", "Laundry", "Parking", "Balcony", "Pets", "Other"];
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [otherAmenity, setOtherAmenity] = useState('');

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} scrollBehavior={'inside'}>
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>Edit Listing</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody pb={6}>
                        <FormControl isRequired>
                            <FormLabel>Address</FormLabel>
                        </FormControl>
                        <Input type="text" placeholder="Street address"/>
                        <FormLabel mt={2}>Realty Company</FormLabel>
                        <Input type="text" placeholder="Company name"/>
                        <FormControl isRequired>
                            <FormLabel mt={2}>Bedroom</FormLabel>
                            <Select name="bedroom" placeholder="Select bedroom amount">
                                {bedrooms.map((bedroom) => (
                                    <option key={bedroom} value={bedroom}>
                                        {bedroom}
                                    </option>
                                ))}
                            </Select>
                            <FormLabel mt={2}>Bathroom</FormLabel>
                            <Select name="bathroom" placeholder="Select bathroom amount">
                                {bathrooms.map((bathroom) => (
                                    <option key={bathroom} value={bathroom}>
                                        {bathroom} Bath
                                    </option>
                                ))}
                            </Select>
                            <FormLabel mt={2}>Monthly Rent</FormLabel>
                            <NumberInput
                                min={0}
                                precision={2}
                                step={50}
                            >
                                <NumberInputField placeholder="Enter amount"/>
                                <NumberInputStepper>
                                    <NumberIncrementStepper/>
                                    <NumberDecrementStepper/>
                                </NumberInputStepper>
                            </NumberInput>
                        </FormControl>
                        <Flex>
                            <FormLabel mt={2}>Security Deposit</FormLabel>
                            <Checkbox
                                isChecked={isSecurityDeposit}
                                onChange={(e) => setIsSecurityDeposit(e.target.checked)}/>
                        </Flex>
                        {isSecurityDeposit && (
                            <NumberInput
                                min={0}
                                precision={2}
                                step={50}
                            >
                                <NumberInputField placeholder="Enter amount"/>
                                <NumberInputStepper>
                                    <NumberIncrementStepper/>
                                    <NumberDecrementStepper/>
                                </NumberInputStepper>
                            </NumberInput>
                        )}
                        <FormLabel mt={2}>Included Utilities</FormLabel>
                        <CheckboxGroup
                            value={selectedUtilities}
                            onChange={(values) => setSelectedUtilities(values as string[])}
                        >
                            <Flex direction="column" gap={2}>
                                {utilities.map((utility) => (
                                    <Checkbox
                                        key={utility}
                                        value={utility}
                                    >
                                        {utility}
                                    </Checkbox>
                                ))}

                                {selectedUtilities.includes("Other") && (
                                    <Input
                                        value={otherUtility}
                                        onChange={(e) => setOtherUtility(e.target.value)}
                                        placeholder="Please specify"
                                    />
                                )}
                            </Flex>
                        </CheckboxGroup>
                        <FormLabel mt={2}>Included Amenities</FormLabel>
                        <CheckboxGroup
                            value={selectedAmenities}
                            onChange={(values) => setSelectedAmenities(values as string[])}
                        >
                            <Flex direction="column" gap={2}>
                                {amenities.map((amenity) => (
                                    <Checkbox
                                        key={amenity}
                                        value={amenity}
                                    >
                                        {amenity}
                                    </Checkbox>
                                ))}

                                {selectedAmenities.includes("Other") && (
                                    <Input
                                        value={otherAmenity}
                                        onChange={(e) => setOtherAmenity(e.target.value)}
                                        placeholder="Please specify"
                                    />
                                )}
                            </Flex>
                        </CheckboxGroup>
                        <FormControl isRequired>
                            <FormLabel mt={2}>Lease Dates</FormLabel>
                            <HStack spacing={4}>
                                <Input
                                    type="date"
                                />
                                <Text>-</Text>
                                <Input
                                    type="date"
                                />
                            </HStack>
                        </FormControl>
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme='blue' mr={3}>
                            Update Listing
                        </Button>
                        <Button variant='ghost' onClick={onClose}>Cancel</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}
export default EditListing