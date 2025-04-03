import { useEffect, useRef, useState } from "react";
import {
    Button,
    Popover,
    PopoverContent,
    PopoverArrow,
    PopoverCloseButton,
    PopoverHeader,
    PopoverBody,
    Spinner,
    Text,
    usePopper,
    Box,
} from "@chakra-ui/react";
import { UsersService } from "../../client";
import type { UsersReadUserTutorialStatusResponse } from "../../client";

const TOTAL_STEPS = 5;

const ProfileTutorial = () => {
    const [tutorialCompleted, setTutorialCompleted] = useState<boolean | null>(null);
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const nameRef = useRef<HTMLElement | null>(null);
    const emailRef = useRef<HTMLElement | null>(null);
    const phoneRef = useRef<HTMLElement | null>(null);
    const bioRef = useRef<HTMLElement | null>(null);
    const buttonRef = useRef<HTMLElement | null>(null);

    const { referenceRef, popperRef } = usePopper({
        placement: "right-start",
        modifiers: [{ name: "offset", options: { offset: [100, 0] } }],
    });

    useEffect(() => {
        nameRef.current = document.getElementById("tutorial-anchor-name");
        emailRef.current = document.getElementById("tutorial-anchor-email");
        phoneRef.current = document.getElementById("tutorial-anchor-phone");
        bioRef.current = document.getElementById("tutorial-anchor-bio");
        buttonRef.current = document.getElementById("tutorial-anchor-button");
    }, []);

    useEffect(() => {
        const refs = [nameRef, emailRef, phoneRef, bioRef, buttonRef];
        const current = refs[step]?.current;
        if (current) {
            referenceRef(current);
            current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [step, referenceRef]);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const data: UsersReadUserTutorialStatusResponse = await UsersService.readUserTutorialStatus();
                setTutorialCompleted(data.profile_tutorial_completed);
            } catch (err) {
                console.error("Error fetching tutorial status", err);
                setTutorialCompleted(true);
            }
        };
        fetchStatus();
    }, []);

    const handleComplete = async () => {
        try {
            setIsSubmitting(true);
            await UsersService.completeProfileTutorial();
            setTutorialCompleted(true);
        } catch (err) {
            console.error("Failed to complete tutorial", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (tutorialCompleted === null) return <Spinner />;
    if (tutorialCompleted) return null;

    return (
        <Popover isOpen placement="right-end">
            <PopoverContent ref={popperRef} maxW="300px" zIndex={9999} ml="500">
                <PopoverArrow />
                <PopoverCloseButton onClick={handleComplete} />
                <PopoverHeader>
                    {step === 0 && "Profile Name Visibility"}
                    {step === 1 && "Email Visibility"}
                    {step === 2 && "Phone Number Visibility"}
                    {step === 3 && "Bio Visibility"}
                    {step === 4 && "Saving Changes"}
                </PopoverHeader>
                <PopoverBody>
                    {step === 0 && <Text>Control if your name is shown on your profile.</Text>}
                    {step === 1 && <Text>Toggle the visibility of your email.</Text>}
                    {step === 2 && <Text>Control if your phone number is shown.</Text>}
                    {step === 3 && <Text>Decide if your bio should be visible to others.</Text>}
                    {step === 4 && <Text>Click the button to save your visibility settings.</Text>}

                    <Button
                        mt={2}
                        size="sm"
                        onClick={() => step < TOTAL_STEPS - 1 ? setStep(step + 1) : handleComplete()}
                        isLoading={isSubmitting}
                        width="100%"
                    >
                        {step < TOTAL_STEPS - 1 ? "Next" : "Done"}
                    </Button>

                    <Box display="flex" justifyContent="center" mt={3} gap={2}>
                        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                            <Box
                                key={i}
                                w="8px"
                                h="8px"
                                borderRadius="full"
                                bg={i === step ? "blue.500" : "gray.300"}
                                transition="background-color 0.3s ease"
                            />
                        ))}
                    </Box>
                </PopoverBody>
            </PopoverContent>
        </Popover>
    );
};

export default ProfileTutorial;
