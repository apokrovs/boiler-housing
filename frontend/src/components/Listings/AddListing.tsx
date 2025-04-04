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
    VStack,
    Box,
    Image,
    IconButton,
} from '@chakra-ui/react'
import {useRef, useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import useCustomToast from "../../hooks/useCustomToast.ts";
import {type SubmitHandler, useForm} from "react-hook-form";
import {type ApiError, ListingCreate, ListingsService} from "../../client";
import {handleError} from "../../utils.ts";
import {AddIcon, DeleteIcon} from '@chakra-ui/icons'

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

    // Image handling states
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [primaryImageIndex, setPrimaryImageIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Lease Agreement states
    const [leaseAgreementFile, setLeaseAgreementFile] = useState<File | null>(null);
    const [leaseAgreementDescription, setLeaseAgreementDescription] = useState("");
    const leaseAgreementInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...newFiles]);
            const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
            if (primaryImageIndex === null) {
                setPrimaryImageIndex(0);
            }
        }
    };

    const handleRemoveFile = (index: number) => {
        URL.revokeObjectURL(previewUrls[index]);
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
        if (primaryImageIndex === index) {
            if (selectedFiles.length > 1) {
                setPrimaryImageIndex(0);
            } else {
                setPrimaryImageIndex(null);
            }
        } else if (primaryImageIndex !== null && primaryImageIndex > index) {
            setPrimaryImageIndex(primaryImageIndex - 1);
        }
    };

    const handleSetPrimary = (index: number) => {
        setPrimaryImageIndex(index);
    };

    const uploadImages = async (listingId: string) => {
        if (selectedFiles.length === 0) return;
        const uploadPromises = selectedFiles.map((file, index) => {
            return ListingsService.uploadListingImage({
                listingId,
                formData: {
                    file,
                    is_primary: index === primaryImageIndex
                }
            });
        });
        try {
            await Promise.all(uploadPromises);
        } catch (error) {
            console.error("Error uploading images:", error);
            showToast("Error", "Failed to upload one or more images", "error");
            throw error;
        }
    };

    // Lease Agreement handler for AddListing – only upload if a file is selected.
    const uploadLeaseAgreement = async (listingId: string) => {
        if (!leaseAgreementFile) return;
        const dataToUpload = {
            file: leaseAgreementFile,
            description: leaseAgreementDescription,
        };
        await ListingsService.uploadLeaseAgreement({
            listingId,
            formData: dataToUpload,
            currentUser: undefined,
        });
    };

    const queryClient = useQueryClient();
    const showToast = useCustomToast();
    const {register, handleSubmit, reset, getValues, formState: {errors, isSubmitting}} = useForm<ListingCreate>({
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
    });

    const mutation = useMutation({
        mutationFn: async (data: ListingCreate) => {
            const listing = await ListingsService.createListing({requestBody: data});
            if (selectedFiles.length > 0) {
                await uploadImages(listing.id);
            }
            await uploadLeaseAgreement(listing.id);
            return listing;
        },
        onSuccess: () => {
            showToast("Success!", "Listing created successfully.", "success");
            reset();
            setSelectedUtilities([]);
            setSelectedAmenities([]);
            setLeaseStartDate("");
            setLeaseEndDate("");
            setIsSecurityDeposit(false);
            setSelectedFiles([]);
            setPreviewUrls([]);
            setPrimaryImageIndex(null);
            setLeaseAgreementFile(null);
            setLeaseAgreementDescription("");
            onClose();
        },
        onError: (err: ApiError) => {
            handleError(err, showToast);
        },
        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ["listings"]});
        },
    });

    const onSubmit: SubmitHandler<ListingCreate> = (data) => {
        data.included_utilities = selectedUtilities;
        data.amenities = selectedAmenities;
        mutation.mutate(data);
    };

    const onCancel = () => {
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        reset();
        setSelectedFiles([]);
        setPreviewUrls([]);
        setPrimaryImageIndex(null);
        onClose();
    };

    return (
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
                            {...register("address", {required: "Address is required."})}
                            placeholder="Street address"
                            type="text"
                        />
                        {errors.address && <FormErrorMessage>{errors.address.message}</FormErrorMessage>}
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
                            {...register("num_bedrooms", {required: "Number of bedrooms is required."})}
                            placeholder="Select bedroom amount"
                        >
                            {bedrooms.map((bedroom) => (
                                <option key={bedroom} value={bedroom}>{bedroom}</option>
                            ))}
                        </Select>
                        {errors.num_bedrooms && <FormErrorMessage>{errors.num_bedrooms.message}</FormErrorMessage>}
                    </FormControl>

                    {/* Bathrooms */}
                    <FormControl isRequired isInvalid={!!errors.num_bathrooms}>
                        <FormLabel mt={2}>Bathroom</FormLabel>
                        <Select
                            id="num_bathrooms"
                            {...register("num_bathrooms", {required: "Number of bathrooms is required."})}
                            placeholder="Select bathroom amount"
                        >
                            {bathrooms.map((bathroom) => (
                                <option key={bathroom} value={bathroom}>{bathroom} Bath</option>
                            ))}
                        </Select>
                        {errors.num_bathrooms && <FormErrorMessage>{errors.num_bathrooms.message}</FormErrorMessage>}
                    </FormControl>

                    {/* Rent */}
                    <FormControl isRequired isInvalid={!!errors.rent}>
                        <FormLabel mt={2}>Monthly Rent</FormLabel>
                        <NumberInput min={0} precision={2} step={50}>
                            <NumberInputField
                                id="rent"
                                {...register("rent", {required: "Monthly rent is required."})}
                                placeholder="Enter amount"
                            />
                            <NumberInputStepper>
                                <NumberIncrementStepper/>
                                <NumberDecrementStepper/>
                            </NumberInputStepper>
                        </NumberInput>
                        {errors.rent && <FormErrorMessage>{errors.rent.message}</FormErrorMessage>}
                    </FormControl>

                    {/* Security deposit */}
                    <Flex>
                        <FormLabel mt={2}>Security Deposit</FormLabel>
                        <Checkbox isChecked={isSecurityDeposit}
                                  onChange={(e) => setIsSecurityDeposit(e.target.checked)}/>
                    </Flex>
                    {isSecurityDeposit && (
                        <NumberInput min={0} precision={2} step={50}>
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
                    <CheckboxGroup value={selectedUtilities}
                                   onChange={(values) => setSelectedUtilities(values as string[])}>
                        <Flex direction="column" gap={2}>
                            {utilities.map((utility) => (
                                <Checkbox key={utility} value={utility}>{utility}</Checkbox>
                            ))}
                        </Flex>
                    </CheckboxGroup>

                    {/* Included amenities */}
                    <FormLabel mt={2}>Included Amenities</FormLabel>
                    <CheckboxGroup value={selectedAmenities}
                                   onChange={(values) => setSelectedAmenities(values as string[])}>
                        <Flex direction="column" gap={2}>
                            {amenities.map((amenity) => (
                                <Checkbox key={amenity} value={amenity}>{amenity}</Checkbox>
                            ))}
                        </Flex>
                    </CheckboxGroup>

                    {/* Lease dates */}
                    <FormControl isRequired isInvalid={!!dateError}>
                        <FormLabel mt={2}>Lease Dates</FormLabel>
                        <HStack spacing={4}>
                            <Input id="lease_start_date" type="date" {...register("lease_start_date")}
                                   value={leaseStartDate} onChange={handleStartDateChange}/>
                            <Text>-</Text>
                            <Input id="lease_end_date" type="date" {...register("lease_end_date")}
                                   value={leaseEndDate} onChange={handleEndDateChange}/>
                        </HStack>
                        {dateError && <FormErrorMessage>{dateError}</FormErrorMessage>}
                    </FormControl>

                    {/* Property Images */}
                    <FormControl mt={4}>
                        <FormLabel>Property Images</FormLabel>
                        <input type="file" multiple
                               accept="image/jpeg,image/png,image/webp,image/gif"
                               style={{display: "none"}}
                               onChange={handleFileChange}
                               ref={fileInputRef}
                        />
                        <VStack align="start" spacing={4} width="100%">
                            <Button leftIcon={<AddIcon/>} onClick={() => fileInputRef.current?.click()}>
                                Add Images
                            </Button>
                            {previewUrls.length > 0 && (
                                <HStack spacing={3} overflowX="auto" py={2} width="100%">
                                    {previewUrls.map((url, index) => (
                                        <Box key={index} position="relative"
                                             border="1px solid"
                                             borderColor={index === primaryImageIndex ? "blue.500" : "gray.200"}
                                             borderWidth={index === primaryImageIndex ? "2px" : "1px"}
                                             borderRadius="md" overflow="hidden">
                                            <Image src={url} alt={`Preview ${index + 1}`} height="80px" width="80px"
                                                   objectFit="cover"/>
                                            <HStack position="absolute" bottom="0" width="100%" bg="blackAlpha.600"
                                                    p={1} justifyContent="space-between">
                                                <Button size="xs"
                                                        colorScheme={index === primaryImageIndex ? "blue" : "gray"}
                                                        onClick={() => handleSetPrimary(index)}>
                                                    {/*{index === primaryImageIndex ? "Primary" : "Set Primary"}*/}
                                                </Button>
                                                <IconButton aria-label="Remove image" icon={<DeleteIcon/>}
                                                            size="xs" colorScheme="red"
                                                            onClick={() => handleRemoveFile(index)}/>
                                            </HStack>
                                        </Box>
                                    ))}
                                </HStack>
                            )}
                        </VStack>
                    </FormControl>

                    {/* Lease Agreement Section */}
                    <FormControl mt={4}>
                        <FormLabel>Lease Agreement</FormLabel>
                        {leaseAgreementFile ? (
                            <Box border="1px solid" borderColor="gray.200" p={2} borderRadius="md" mb={2}>
                                <Text>Selected File: {leaseAgreementFile.name}</Text>
                                <FormLabel mt={2}>Description</FormLabel>
                                <Input
                                    value={leaseAgreementDescription}
                                    onChange={(e) => setLeaseAgreementDescription(e.target.value)}
                                    placeholder="Lease agreement description"
                                />
                                <Button mt={2} colorScheme="red" onClick={() => setLeaseAgreementFile(null)}>
                                    Remove Selected File
                                </Button>
                            </Box>
                        ) : (
                            <Button onClick={() => leaseAgreementInputRef.current?.click()}>
                                Add Lease Agreement
                            </Button>
                        )}
                        <input
                            type="file"
                            accept="application/pdf,text/plain"
                            style={{display: "none"}}
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    setLeaseAgreementFile(e.target.files[0]);
                                }
                            }}
                            ref={leaseAgreementInputRef}
                        />
                    </FormControl>
                </ModalBody>

                <ModalFooter>
                    <Button
                        colorScheme='blue'
                        mr={3} type="submit"
                        isLoading={isSubmitting}
                        isDisabled={
                            isSubmitting ||
                            Object.keys(errors).length > 0 ||
                            !getValues("address") ||
                            !getValues("num_bedrooms") ||
                            !getValues("num_bathrooms") ||
                            !getValues("rent") ||
                            leaseStartDate === "" ||
                            leaseEndDate === "" ||
                            dateError !== ""
                        }
                    >
                        Add Listing
                    </Button>
                    <Button variant='ghost' onClick={onCancel}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddListing;
