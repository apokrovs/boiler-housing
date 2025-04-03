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
import {useRef, useState, useEffect} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import useCustomToast from "../../hooks/useCustomToast.ts";
import {type SubmitHandler, useForm} from "react-hook-form";
import {type ApiError, ListingPublic, ListingsService, ListingUpdate} from "../../client";
import {handleError} from "../../utils.ts";
import { AddIcon, DeleteIcon } from '@chakra-ui/icons'

interface EditListingProps {
    listing: ListingPublic
    isOpen: boolean
    onClose: () => void
}

const EditListing = ({listing, isOpen, onClose}: EditListingProps) => {
    const bedrooms = ['Studio', '1 Bed', '2 Bed', '3+ Bed'];
    const bathrooms = ['1', '2', '3+'];
    const [isSecurityDeposit, setIsSecurityDeposit] = useState(!!listing.security_deposit);
    const utilities = ["Water", "Sewage", "Garbage", "Electricity", "Gas", "Internet/Cable"];
    const [selectedUtilities, setSelectedUtilities] = useState<string[]>(listing.included_utilities ?? []);
    const amenities = ["Maintenance", "Trash Removal", "Fitness Center", "Pool", "Furnished", "Laundry", "Parking", "Balcony", "Pets"];
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(listing.amenities ?? []);
    const [leaseStartDate, setLeaseStartDate] = useState(listing.lease_start_date);
    const [leaseEndDate, setLeaseEndDate] = useState(listing.lease_end_date);
    const [dateError, setDateError] = useState("");

    // Image handling states
    const [existingImages, setExistingImages] = useState<any[]>(listing.images || []);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);
    const [primaryPreviewIndex, setPrimaryPreviewIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize primary image from existing images
    useEffect(() => {
        const primaryImage = listing.images?.find(img => img.is_primary);
        if (primaryImage) {
            setPrimaryImageId(primaryImage.id as string);
        }
    }, [listing]);

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

    // Handle file selection for new images
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...newFiles]);

            // Create preview URLs
            const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviewUrls]);

            // Set first new image as primary if no existing primary
            if (primaryImageId === null && primaryPreviewIndex === null && existingImages.length === 0) {
                setPrimaryPreviewIndex(0);
            }
        }
    };

    // Handle removing a new file from the selection
    const handleRemoveFile = (index: number) => {
        // Clean up URL to prevent memory leaks
        URL.revokeObjectURL(previewUrls[index]);

        // Remove file and preview
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));

        // Update primary preview index if needed
        if (primaryPreviewIndex === index) {
            if (selectedFiles.length > 1) {
                setPrimaryPreviewIndex(0);
            } else {
                setPrimaryPreviewIndex(null);
            }
        } else if (primaryPreviewIndex !== null && primaryPreviewIndex > index) {
            setPrimaryPreviewIndex(primaryPreviewIndex - 1);
        }
    };

    // Handle removing an existing image
    const handleRemoveExistingImage = async (imageId: string) => {
        try {
            await ListingsService.deleteListingImage({
                listingId: listing.id,
                imageId: imageId
            });

            // Update UI state
            setExistingImages(prev => prev.filter(img => img.id !== imageId));

            // Update primary if needed
            if (primaryImageId === imageId) {
                const remaining = existingImages.filter(img => img.id !== imageId);
                if (remaining.length > 0) {
                    setPrimaryImageId(remaining[0].id);

                    // Update primary status on server
                    await ListingsService.updateListingImage({
                        listingId: listing.id,
                        imageId: remaining[0].id,
                        requestBody: {
                            is_primary: true
                        }
                    });
                } else {
                    setPrimaryImageId(null);
                }
            }

            showToast("Success", "Image removed successfully", "success");
        } catch (error) {
            console.error("Error removing image:", error);
            showToast("Error", "Failed to remove image", "error");
        }
    };

    // Set an existing image as primary
    const handleSetPrimaryExisting = async (imageId: string) => {
        try {
            await ListingsService.updateListingImage({
                listingId: listing.id,
                imageId: imageId,
                requestBody: {
                    is_primary: true
                }
            });

            setPrimaryImageId(imageId);
            setPrimaryPreviewIndex(null);

            // Update UI state without refetching
            setExistingImages(prev =>
                prev.map(img => ({
                    ...img,
                    is_primary: img.id === imageId
                }))
            );

            showToast("Success", "Primary image updated", "success");
        } catch (error) {
            console.error("Error setting primary image:", error);
            showToast("Error", "Failed to update primary image", "error");
        }
    };

    // Set a new image as primary
    const handleSetPrimaryPreview = (index: number) => {
        setPrimaryPreviewIndex(index);
        setPrimaryImageId(null);
    };

    // Upload new images
    const uploadNewImages = async () => {
        if (selectedFiles.length === 0) return;

        const uploadPromises = selectedFiles.map((file, index) => {
            return ListingsService.uploadListingImage({
                listingId: listing.id,
                formData: {
                    file,
                    is_primary: index === primaryPreviewIndex && !primaryImageId
                }
            });
        });

        try {
            await Promise.all(uploadPromises);
        } catch (error) {
            console.error("Error uploading images:", error);
            showToast("Error", "Failed to upload one or more images", "error");
            throw error; // Re-throw to handle in the parent function
        }
    };

    const queryClient = useQueryClient();
    const showToast = useCustomToast();
    const {
        register,
        handleSubmit,
        reset,
        formState: {isSubmitting, errors},
    } = useForm<ListingUpdate>({
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: listing,
    });

    const mutation = useMutation({
        mutationFn: async (data: ListingUpdate) => {
            // Update listing first
            const updatedListing = await ListingsService.updateListing({id: listing.id, requestBody: data});

            // Upload new images if any
            if (selectedFiles.length > 0) {
                await uploadNewImages();
            }

            return updatedListing;
        },
        onSuccess: () => {
            showToast("Success!", "Listing updated successfully.", "success");
            onClose();
        },
        onError: (err: ApiError) => {
            handleError(err, showToast);
        },
        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ["listings"]});
        },
    });

    const onSubmit: SubmitHandler<ListingUpdate> = (data) => {
        if (!isSecurityDeposit) {
            data.security_deposit = null;
        }
        data.included_utilities = selectedUtilities;
        data.amenities = selectedAmenities;

        mutation.mutate(data);
    };

    const onCancel = () => {
        // Clean up any preview URLs
        previewUrls.forEach(url => URL.revokeObjectURL(url));

        reset();
        setSelectedFiles([]);
        setPreviewUrls([]);
        setPrimaryPreviewIndex(null);
        onClose();
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} scrollBehavior={'inside'}>
                <ModalOverlay/>
                <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
                    <ModalHeader>Edit Listing</ModalHeader>
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
                                    value={leaseStartDate ?? ""}
                                    onChange={handleStartDateChange}
                                />
                                <Text>-</Text>
                                <Input
                                    id="lease_end_date"
                                    type="date"
                                    {...register("lease_end_date")}
                                    value={leaseEndDate ?? ""}
                                    onChange={handleEndDateChange}
                                />
                            </HStack>
                            {dateError && <FormErrorMessage>{dateError}</FormErrorMessage>}
                        </FormControl>

                        {/* Property Images */}
                        <FormControl mt={4}>
                            <FormLabel>Property Images</FormLabel>

                            {/* Existing Images */}
                            {existingImages.length > 0 && (
                                <>
                                    <Text fontSize="sm" fontWeight="medium" mt={2} mb={1}>Current Images</Text>
                                    <HStack spacing={3} overflowX="auto" py={2} width="100%">
                                        {existingImages.map((img) => (
                                            <Box
                                                key={img.id}
                                                position="relative"
                                                border="1px solid"
                                                borderColor={img.is_primary || img.id === primaryImageId ? "blue.500" : "gray.200"}
                                                borderWidth={img.is_primary || img.id === primaryImageId ? "2px" : "1px"}
                                                borderRadius="md"
                                                overflow="hidden"
                                            >
                                                <Image
                                                    src={`${import.meta.env.VITE_API_URL}/uploads/${img.file_path}`}
                                                    alt="Property image"
                                                    height="80px"
                                                    width="80px"
                                                    objectFit="cover"
                                                />
                                                <HStack
                                                    position="absolute"
                                                    bottom="0"
                                                    width="100%"
                                                    bg="blackAlpha.600"
                                                    p={1}
                                                    justifyContent="space-between"
                                                >
                                                    <Button
                                                        size="xs"
                                                        colorScheme={img.is_primary || img.id === primaryImageId ? "blue" : "gray"}
                                                        onClick={() => handleSetPrimaryExisting(img.id)}
                                                    >
                                                        {img.is_primary || img.id === primaryImageId ? "Primary" : "Set Primary"}
                                                    </Button>
                                                    <IconButton
                                                        aria-label="Remove image"
                                                        icon={<DeleteIcon />}
                                                        size="xs"
                                                        colorScheme="red"
                                                        onClick={() => handleRemoveExistingImage(img.id)}
                                                    />
                                                </HStack>
                                            </Box>
                                        ))}
                                    </HStack>
                                </>
                            )}

                            {/* New Images Upload */}
                            <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                style={{ display: "none" }}
                                onChange={handleFileChange}
                                ref={fileInputRef}
                            />

                            <VStack align="start" spacing={4} width="100%" mt={4}>
                                <Button
                                    leftIcon={<AddIcon />}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Add New Images
                                </Button>

                                {previewUrls.length > 0 && (
                                    <>
                                        <Text fontSize="sm" fontWeight="medium" mt={1} mb={0}>New Images</Text>
                                        <HStack spacing={3} overflowX="auto" py={2} width="100%">
                                            {previewUrls.map((url, index) => (
                                                <Box
                                                    key={index}
                                                    position="relative"
                                                    border="1px solid"
                                                    borderColor={index === primaryPreviewIndex ? "blue.500" : "gray.200"}
                                                    borderWidth={index === primaryPreviewIndex ? "2px" : "1px"}
                                                    borderRadius="md"
                                                    overflow="hidden"
                                                >
                                                    <Image
                                                        src={url}
                                                        alt={`Preview ${index + 1}`}
                                                        height="80px"
                                                        width="80px"
                                                        objectFit="cover"
                                                    />
                                                    <HStack
                                                        position="absolute"
                                                        bottom="0"
                                                        width="100%"
                                                        bg="blackAlpha.600"
                                                        p={1}
                                                        justifyContent="space-between"
                                                    >
                                                        <Button
                                                            size="xs"
                                                            colorScheme={index === primaryPreviewIndex ? "blue" : "gray"}
                                                            onClick={() => handleSetPrimaryPreview(index)}
                                                        >
                                                            {index === primaryPreviewIndex ? "Primary" : "Set Primary"}
                                                        </Button>
                                                        <IconButton
                                                            aria-label="Remove image"
                                                            icon={<DeleteIcon />}
                                                            size="xs"
                                                            colorScheme="red"
                                                            onClick={() => handleRemoveFile(index)}
                                                        />
                                                    </HStack>
                                                </Box>
                                            ))}
                                        </HStack>
                                    </>
                                )}
                            </VStack>
                        </FormControl>
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme='blue' mr={3} type="submit" isLoading={isSubmitting}>
                            Update Listing
                        </Button>
                        <Button variant='ghost' onClick={onCancel}>Cancel</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default EditListing;