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
    FormErrorMessage,
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
import {useMutation, useQueryClient} from "@tanstack/react-query";
import useCustomToast from "../../hooks/useCustomToast.ts";
import {type SubmitHandler, useForm} from "react-hook-form";
import {type ApiError, ListingCreate, ListingsService} from "../../client";
import {handleError} from "../../utils.ts";

interface AddListingProps {
    isOpen: boolean
    onClose: () => void
}

const AddListing = ({isOpen, onClose}: AddListingProps) => {
    const bedrooms = ['Studio', '1 Bed', '2 Bed', '3+ Bed'];
    const bathrooms = ['1', '2', '3+'];
    const [isSecurityDeposit, setIsSecurityDeposit] = useState(false);
    const utilities = ["Water", "Sewage", "Garbage", "Electricity", "Gas", "Internet/Cable"];
    const [selectedUtilities, setSelectedUtilities] = useState<string[]>([]);
    const amenities = ["Maintenance", "Trash Removal", "Fitness Center", "Pool", "Furnished", "Laundry", "Parking", "Balcony", "Pets"];
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [leaseStartDate, setLeaseStartDate] = useState("");
    const [leaseEndDate, setLeaseEndDate] = useState("");
    const [dateError, setDateError] = useState("");

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLeaseStartDate(e.target.value);
        if (leaseEndDate && e.target.value >= leaseEndDate) {
            setDateError("End date must be after the start date.");
        } else {
            setDateError("");
        }
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLeaseEndDate(e.target.value);
        if (leaseStartDate && e.target.value <= leaseStartDate) {
            setDateError("End date must be after the start date.");
        } else {
            setDateError("");
        }
    };

    const queryClient = useQueryClient()
    const showToast = useCustomToast()
    const {
        register,
        handleSubmit,
        reset,
        formState: {errors, isSubmitting},
    } = useForm<ListingCreate>({
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: {
            num_bedrooms: "",
            num_bathrooms: "",
            address: "",
            realty_company: "",
            rent: 0,
            included_utilities: [],
            security_deposit: "",
            amenities: [],
            lease_start_date: "",
            lease_end_date: ""
        },
    })

    const mutation = useMutation({
        mutationFn: (data: ListingCreate) =>
            ListingsService.createListing({requestBody: data}),
        onSuccess: () => {
            showToast("Success!", "Listing created successfully.", "success")
            reset()
            setSelectedUtilities([]);
            setSelectedAmenities([]);
            setLeaseStartDate("");
            setLeaseEndDate("");
            setIsSecurityDeposit(false);
            onClose();
        },
        onError: (err: ApiError) => {
            handleError(err, showToast)
        },
        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ["listings"]})
        },
    })

    const onSubmit: SubmitHandler<ListingCreate> = (data) => {
        data.included_utilities = selectedUtilities;
        data.amenities =  selectedAmenities;

        console.log(data)
        mutation.mutate(data)
    }

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} scrollBehavior={'inside'}>
                <ModalOverlay/>
                <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
                    <ModalHeader>Add Listing</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody pb={6}>
                        {/* Address */}
                        <FormControl isRequired isInvalid={!!errors.address}>
                            <FormLabel>Address</FormLabel>
                            <Input
                                id="address"
                                {...register("address", {
                                    required: "Address is required.",
                                })}
                                placeholder="Street address"
                                type="text"
                            />
                            {errors.address && (
                                <FormErrorMessage>{errors.address.message}</FormErrorMessage>
                            )}
                        </FormControl>

                        {/* Realty Company */}
                        <FormLabel mt={2}>Realty Company</FormLabel>
                        <Input
                            id="realty_company"
                            type="text"
                            {...register("realty_company")}
                            placeholder="Company name"
                        />

                        {/* Bedrooms */}
                        <FormControl isRequired isInvalid={!!errors.num_bedrooms}>
                            <FormLabel mt={2}>Bedroom</FormLabel>
                            <Select
                                id="num_bedrooms"
                                {...register("num_bedrooms", {
                                    required: "Number of bedrooms is required.",
                                })}
                                placeholder="Select bedroom amount"
                            >
                                {bedrooms.map((bedroom) => (
                                    <option key={bedroom} value={bedroom}>
                                        {bedroom}
                                    </option>
                                ))}
                            </Select>
                            {errors.num_bedrooms && (
                                <FormErrorMessage>{errors.num_bedrooms.message}</FormErrorMessage>
                            )}
                        </FormControl>

                        {/* Bathrooms */}
                        <FormControl isRequired isInvalid={!!errors.num_bathrooms}>
                            <FormLabel mt={2}>Bathroom</FormLabel>
                            <Select
                                id="num_bathrooms"
                                {...register("num_bathrooms", {
                                    required: "Number of bathrooms is required.",
                                })}
                                placeholder="Select bathroom amount"
                            >
                                {bathrooms.map((bathroom) => (
                                    <option key={bathroom} value={bathroom}>
                                        {bathroom} Bath
                                    </option>
                                ))}
                            </Select>
                            {errors.num_bathrooms && (
                                <FormErrorMessage>{errors.num_bathrooms.message}</FormErrorMessage>
                            )}
                        </FormControl>

                        {/* Rent */}
                        <FormControl isRequired isInvalid={!!errors.rent}>
                            <FormLabel mt={2}>Monthly Rent</FormLabel>
                            <NumberInput
                                min={0}
                                precision={2}
                                step={50}
                            >
                                <NumberInputField
                                    id="rent"
                                    {...register("rent", {
                                        required: "Monthly rent is required.",
                                    })}
                                    placeholder="Enter amount"
                                />
                                <NumberInputStepper>
                                    <NumberIncrementStepper/>
                                    <NumberDecrementStepper/>
                                </NumberInputStepper>
                            </NumberInput>
                            {errors.rent && (
                                <FormErrorMessage>{errors.rent.message}</FormErrorMessage>
                            )}
                        </FormControl>

                        {/* Security deposit */}
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
                                <NumberInputField
                                    id="security_deposit"
                                    {...register("security_deposit")}
                                    placeholder="Enter amount"
                                />
                                <NumberInputStepper>
                                    <NumberIncrementStepper/>
                                    <NumberDecrementStepper/>
                                </NumberInputStepper>
                            </NumberInput>
                        )}

                        {/* Included utilities */}
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
                            </Flex>
                        </CheckboxGroup>

                        {/* Included amenities */}
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
                            </Flex>
                        </CheckboxGroup>

                        {/* Lease dates */}
                        <FormControl isRequired isInvalid={!!dateError}>
                            <FormLabel mt={2}>Lease Dates</FormLabel>
                            <HStack spacing={4}>
                                <Input
                                    id="lease_start_date"
                                    type="date"
                                    {...register("lease_start_date")}
                                    value={leaseStartDate}
                                    onChange={handleStartDateChange}
                                />
                                <Text>-</Text>
                                <Input
                                    id="lease_end_date"
                                    type="date"
                                    {...register("lease_end_date")}
                                    value={leaseEndDate}
                                    onChange={handleEndDateChange}
                                />
                            </HStack>
                            {dateError && <FormErrorMessage>{dateError}</FormErrorMessage>}
                        </FormControl>
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme='blue' mr={3} type="submit" isLoading={isSubmitting}>
                            Add Listing
                        </Button>
                        <Button variant='ghost' onClick={onClose}>Cancel</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}
export default AddListing