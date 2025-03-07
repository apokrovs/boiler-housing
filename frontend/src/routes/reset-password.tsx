import { useState } from "react";
import {
    Button, Container, FormControl, FormErrorMessage, Heading, Input, Text
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { type SubmitHandler, useForm } from "react-hook-form";
import { LoginService } from "../client";
import useCustomToast from "../hooks/useCustomToast";
import { emailPattern } from "../utils";
import { isLoggedIn } from "../hooks/useAuth";
import { sendOTPNotification } from "../client/emailService.ts";

interface FormData {
    email: string;
    otp: string;
    newPassword: string;
}

export const Route = createFileRoute("/reset-password")({
    component: RecoverPassword,
    beforeLoad: async () => {
        if (isLoggedIn()) {
            throw redirect({ to: "/" });
        }
    },
});

function RecoverPassword() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();
    const showToast = useCustomToast();
    const [generatedOTP, setGeneratedOTP] = useState("");
    const [step, setStep] = useState(1);

    const sendOTPEmail = async (email: string) => {
    if (!email) {
        showToast("Error", "Email is required.", "error");
        console.error("Error: Email is missing when calling sendOTPEmail");
        return;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(otpCode);

    console.log(`Generating OTP: ${otpCode} for email: ${email}`);

    try {
        console.log("Attempting to send OTP email...");
        await sendOTPNotification(email, otpCode);
        console.log("OTP email sent successfully");
    } catch (error) {
        console.error("Error sending OTP email:", error);
    }
};


    const recoverPassword = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
        console.log("Captured Email from Form:", email);
        await sendOTPEmail(email);
    },
    onSuccess: () => {
        console.log("Mutation success: OTP sent");
        showToast("OTP Sent", "Check your email for the OTP code.", "success");
        setStep(2);
    },
    onError: (error) => {
        console.error("Mutation error:", error);
        showToast("Error", "Failed to send OTP. Try again.", "error");
    },
});


    const resetPassword = useMutation({
        mutationFn: async ({ otp, newPassword }: { otp: string; newPassword: string }) => {
            if (otp !== generatedOTP) throw new Error("Invalid OTP");

            await LoginService.resetPassword({
                requestBody: {
                    token: otp,
                    new_password: newPassword
                }
            });
        },
        onSuccess: () => {
            showToast("Success", "Password reset successful. You can now log in.", "success");
        },
        onError: () => {
            showToast("Error", "OTP verification failed.", "error");
        },
    });

    const onSubmit: SubmitHandler<FormData> = async (data) => {
    console.log("Form submitted with data:", data);

    if (step === 1) {
        console.log("Triggering recoverPassword mutation...");
        recoverPassword.mutate({ email: data.email });
    } else {
        console.log("Triggering resetPassword mutation...");
        resetPassword.mutate(data);
    }
};


    return (
        <Container as="form" onSubmit={handleSubmit(onSubmit)}>
            <Heading>Password Recovery</Heading>
            {step === 1 && (
                <>
                    <Text>Enter your email to receive an OTP.</Text>
                    <FormControl isInvalid={!!errors.email}>
                        <Input {...register("email", { required: "Email is required", pattern: emailPattern })}
                               placeholder="Email" type="email" />
                        <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
                    </FormControl>
                    <Button type="submit" isLoading={isSubmitting}>Send OTP</Button>
                </>
            )}
            {step === 2 && (
                <>
                    <Text>Enter the OTP sent to your email.</Text>
                    <FormControl isInvalid={!!errors.otp}>
                        <Input {...register("otp", { required: "OTP is required" })} placeholder="OTP" type="text" />
                        <FormErrorMessage>{errors.otp?.message}</FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={!!errors.newPassword}>
                        <Input {...register("newPassword", { required: "Enter a new password" })}
                               placeholder="New Password" type="password" />
                        <FormErrorMessage>{errors.newPassword?.message}</FormErrorMessage>
                    </FormControl>
                    <Button type="submit" isLoading={isSubmitting}>Reset Password</Button>
                </>
            )}
        </Container>
    );
}

export default RecoverPassword;
