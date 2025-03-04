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
    Text, useColorModeValue, Wrap, WrapItem
} from "@chakra-ui/react"
import {
    type ApiError,
    type RenterPreferencePublic,
    type RenterPreferenceUpdate,
    RenterPreferencesService, RenterPreferenceCreate,
} from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import {handleError} from "../../utils"
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {Controller, type SubmitHandler, useForm} from "react-hook-form";
import {useEffect, useState} from "react";

interface PreferencesProps {
    renter_preference?: RenterPreferencePublic;
    isOpen: boolean;
    onClose: () => void;
}

const RenterPreferences = ({ renter_preference }: PreferencesProps) => {
    const bgActive = useColorModeValue("#f0eee2", "#68634a")
    const queryClient = useQueryClient()
    const showToast = useCustomToast()
    const [updateMode, setUpdateMode] = useState(false)

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { isSubmitting, isDirty },
    } = useForm<RenterPreferenceCreate | RenterPreferenceUpdate>({
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: renter_preference ?? {},
    });

    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const response = await RenterPreferencesService.readRenterPreference();

                if (response && response.id) {
                    console.log("Setting update mode to true")
                    setUpdateMode(true); // Preference exists, enter update mode
                    reset(response)
                }
            } catch (error) {
                console.error("Error fetching preferences:", error);
            }
        };

        fetchPreferences();
    }, []);

    const mutation = useMutation({
        mutationFn: async (data: RenterPreferenceCreate | RenterPreferenceUpdate) => {
            return updateMode
                ? RenterPreferencesService.updateRenterPreference({ requestBody: data as RenterPreferenceUpdate })
                : RenterPreferencesService.createRenterPreference({ requestBody: data as RenterPreferenceCreate });
        },
        onSuccess: () => {
            showToast("Success!", `Preference ${updateMode ? "updated" : "created"} successfully.`, "success");
            setUpdateMode(true)
        },
        onError: (err: ApiError) => {
            console.log("Error:", err);
            handleError(err, showToast);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["renter_preferences"] });
        },
    });

    const onSubmit: SubmitHandler<RenterPreferenceCreate | RenterPreferenceUpdate> = async (data) => {
        console.log("Request payload:", data);
        mutation.mutate(data);
        //setUpdateMode(true)
    };

    return (
        <Container maxW="lg" mt={8}>
            <Heading textAlign="center" size="lg" mb={6}>
                {updateMode ? "Update Your Preferences" : "Create Your Preferences"}
            </Heading>
            <Text textAlign="center" fontSize="md" color="#9c956a">
                 Here you can {updateMode ? "update" : "set up"} your apartment search preferences. These preferences
                 help tailor your search experience!
            </Text>
            <Stack spacing={5} mt={4} mb={6} as="form" onSubmit={handleSubmit(onSubmit)}>
                <FormControl>
                    <FormLabel>Bedroom</FormLabel>
                    <FormHelperText mb={2}>Select the number of bedrooms in your listing search.</FormHelperText>
                    <Controller
                        name="num_bedrooms"
                        control={control}
                        defaultValue={[]}
                        render={({field}) => (
                            <Stack direction="row">
                                {["Studio", "1 Bed", "2 Bed", "3+ Bed"].map((value, index) => (
                                    <Checkbox
                                        key={value}
                                        {...field}
                                        value={value}
                                        id={`num_bedrooms-${index}`} // Ensure unique ID
                                        isChecked={field.value?.includes(value)}
                                        onChange={(e) => {
                                            const newValue = e.target.checked
                                                ? [...(field.value ?? []), value]
                                                : (field.value ?? []).filter((v) => v !== value);
                                            field.onChange(newValue);
                                        }}
                                    >
                                        {value}
                                    </Checkbox>
                                ))}
                            </Stack>
                        )}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Bathroom</FormLabel>
                    <FormHelperText mb={2}>Select the number of bathrooms in your listing search.</FormHelperText>
                    <Controller
                        name="num_bathrooms"
                        control={control}
                        defaultValue={[]}
                        render={({field}) => (
                            <Stack direction="row">
                                {["1", "2", "3+"].map((value, index) => (
                                    <Checkbox
                                        key={value}
                                        {...field}
                                        value={value}
                                        id={`num_bathrooms-${index}`} // Ensure unique ID
                                        isChecked={field.value?.includes(value)}
                                        onChange={(e) => {
                                            const newValue = e.target.checked
                                                ? [...(field.value ?? []), value]
                                                : (field.value ?? []).filter((v) => v !== value);
                                            field.onChange(newValue);
                                        }}
                                    >
                                        {value} Bath
                                    </Checkbox>
                                ))}
                            </Stack>
                        )}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel htmlFor="address">Address</FormLabel>
                    <FormHelperText mb={2}>Specify postings for a specific address.</FormHelperText>
                    <Input
                        id="address"
                        {...register("address", {maxLength: 255})}
                        placeholder="Street Address"
                        type="text"
                    />
                </FormControl>

                <FormControl>
                    <FormLabel htmlFor="realty_company">Realty Company</FormLabel>
                    <FormHelperText mb={2}>Specify postings for a specific realty company.</FormHelperText>
                    <Input
                        id="realty_company"
                        {...register("realty_company", {maxLength: 255})}
                        placeholder="Company Name"
                        type="text"
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Rent</FormLabel>
                    <FormHelperText mb={2}>Select a monthly rent range.</FormHelperText>
                    <HStack spacing={4} align="center">
                        <Input
                            id="min_price"
                            {...register("min_price", {
                                setValueAs: (value) => parseFloat(value) || 0, // Convert to float
                            })}
                            type="number"
                            placeholder="Min Price"
                            min="0"
                        />
                        <Text>-</Text>
                        <Input
                            id={"max_price"}
                            {...register("max_price", {
                                setValueAs: (value) => parseFloat(value) || 0, // Convert to float
                            })}
                            type="number"
                            placeholder="Max Price"
                            min="0"
                        />
                    </HStack>
                </FormControl>

                <FormControl>
                    <FormLabel>Included Utilities</FormLabel>
                    <FormHelperText>Select what utilities you would like included in rent.</FormHelperText>
                    <FormHelperText mb={2}>Some landlords may include certain utilities like water, trash, or basic
                        cable in the monthly rent, while others may require separate payments.</FormHelperText>
                    <Controller
                        name="included_utilities"
                        control={control}
                        defaultValue={[]}
                        render={({field}) => (
                            <Stack direction="row">
                                {["Water", "Sewage", "Garbage", "Electricity", "Gas", "Internet/Cable"].map((value, index) => (
                                    <Checkbox
                                        key={value}
                                        {...field}
                                        value={value}
                                        id={`included_utilities-${index}`} // Ensure unique ID
                                        isChecked={field.value?.includes(value)}
                                        onChange={(e) => {
                                            const newValue = e.target.checked
                                                ? [...(field.value ?? []), value]
                                                : (field.value ?? []).filter((v) => v !== value);
                                            field.onChange(newValue);
                                        }}
                                    >
                                        {value}
                                    </Checkbox>
                                ))}
                            </Stack>
                        )}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Security Deposit</FormLabel>
                    <FormHelperText mb={2}>Select if you would like to include listings with security deposits in your
                        search.</FormHelperText>
                    <Controller
                        name="security_deposit" // The key for this field in form data
                        control={control}
                        defaultValue="no"
                        render={({field}) => (
                            <RadioGroup
                                {...field}
                                value={field.value ?? "no"} // Ensures a valid default selection
                                onChange={(value) => field.onChange(value)} // Ensures correct state update
                            >
                                <Stack direction="row">
                                    <Radio value="yes">Yes</Radio>
                                    <Radio value="no">No</Radio>
                                    <Radio value="noPreference">No Preference</Radio>
                                </Stack>
                            </RadioGroup>
                        )}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Amenities</FormLabel>
                    <FormHelperText mb={2}>Select what amenities you would like in your search.</FormHelperText>
                    <Controller
                        name="amenities"
                        control={control}
                        defaultValue={[]} // Ensure it starts as an array
                        render={({field}) => (
                            <Wrap spacing={4}>
                                {["Maintenance", "Trash Removal", "Fitness Center", "Pool", "Furnished", "Laundry", "Parking", "Balcony", "Pets"].map((label, index) => (
                                    <WrapItem key={label}>
                                        <Checkbox
                                            {...field}
                                            value={label}
                                            id={`amenity-${index}`}
                                            isChecked={field.value?.includes(label)}
                                            onChange={(e) => {
                                                const newValue = e.target.checked
                                                    ? [...(field.value ?? []), label]
                                                    : (field.value ?? []).filter((v) => v !== label);
                                                field.onChange(newValue);
                                            }}
                                        >
                                            {label}
                                        </Checkbox>
                                    </WrapItem>
                                ))}
                            </Wrap>
                        )}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Lease Dates</FormLabel>
                    <FormHelperText mb={2}>Select the start and end dates for your preferred lease
                        period.</FormHelperText>
                    <HStack spacing={4}>
                        <Input
                            id="lease_start_date"
                            {...register("lease_start_date")}
                            placeholder="Company Name"
                            type="date"
                        />
                        <Text>-</Text>
                        <Input
                            id="lease_end_date"
                            {...register("lease_end_date")}
                            type="date"
                        />
                    </HStack>
                </FormControl>

                <Button
                    mt={4}
                    bg={bgActive}
                    variant="primary"
                    type="submit"
                    isLoading={isSubmitting}
                    isDisabled={!isDirty}
                >
                     {updateMode ? "Update Preferences" : "Create Preferences"}
                </Button>
            </Stack>
        </Container>
    )
}
export default RenterPreferences

