import {useState} from "react"

import {
    Button,
    Container,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Stack,
    RadioGroup,
    Radio,
    Text
} from "@chakra-ui/react"
import useAuth from "../../hooks/useAuth.ts";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {UsersService, UsersUpdatePasswordMeData, UserUpdateMe} from "../../client";
import useCustomToast from "../../hooks/useCustomToast.ts";

const ChangePassword = () => {
    const {user} = useAuth()
    const queryClient = useQueryClient()
    const showToast = useCustomToast()

    const [currPassword, setCurrPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const [recoveryEmail, setRecoveryEmail] = useState("")
    const [phone, setRecoveryPhone] = useState("")

    const [autoLogout, setAutoLogout] = useState("10")

    /* useEffect(() => {
        if(user?.auto_logout) {
            setAutoLogout(String(user.auto_logout))
        }
    }, [user]) */

    const updateUserMutation = useMutation({
        mutationFn: (updatedUser: UserUpdateMe) =>
            UsersService.updateUserMe({requestBody: updatedUser}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["currentUser"]})
            showToast("Success!", "Auto logout time updated successfully.", "success")
        },
        onError: (error) => {
            console.error("Failed to update auto logout time.", error)
            alert("Failed to update auto logout time.")
        }
    })

    const changePasswordMutation = useMutation({
        mutationFn: (passwordData: UsersUpdatePasswordMeData) =>
            UsersService.updatePasswordMe(passwordData),
        onSuccess: () => {
            showToast("Success!", "Password updated successfully.", "success");
            setCurrPassword("");
            setNewPassword("");
            setConfirmPassword("");
        },
        onError: (error: any) => {
            console.error("Failed to update password.", error);
            showToast("Error", error.response?.data?.detail || "Password update failed.", "error");
        },
    });


    const handleChangePassword = () => {
        if (newPassword !== confirmPassword) {
            showToast("Error", "New passwords do not match.", "error");
            return;
        }

        changePasswordMutation.mutate({
            requestBody: {
                current_password: currPassword,
                new_password: newPassword,
                confirm_new_password: confirmPassword,
            },
        });
    };


    const handleUpdateRecovery = () => {
        console.log("Recover Email: ", recoveryEmail)
        console.log("Phone Number: ", phone)
        alert("Recovery info updated")
    }

    const handleUpdateLogout = () => {
        console.log("Auto logout time: ", autoLogout)
        if (user) {
            const updatedUser = {...user, auto_logout: Number(autoLogout)}
            updateUserMutation.mutate(updatedUser)
        }
    }

    return (
        <Container maxW="md" mt={8}>
            <Heading size="lg" mb={6}>
                Change Password
            </Heading>

            <Stack spacing={4} mb={6}>
                <FormControl>
                    <FormLabel>Current Password</FormLabel>
                    <Input
                        type="password"
                        value={currPassword}
                        onChange={(e) => setCurrPassword(e.target.value)}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>New Password</FormLabel>
                    <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Confirm New Password</FormLabel>
                    <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </FormControl>

                <Button colorScheme="blue" onClick={handleChangePassword}>
                    Update Password
                </Button>
            </Stack>

            <Heading size="md" mb={4}>
                Recovery Information
            </Heading>
            <Stack spacing={4} mb={6}>
                <FormControl>
                    <FormLabel>Recovery Email</FormLabel>
                    <Input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Recovery Phone Number</FormLabel>
                    <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setRecoveryPhone(e.target.value)}

                    />
                </FormControl>

                <Button colorScheme="blue" onClick={handleUpdateRecovery}>
                    Update Recovery Info
                </Button>
            </Stack>

            <Heading size="md" mb={4}>
                Automatic Logout Time
            </Heading>
            <Stack spacing={4} mb={4}>
                <RadioGroup onChange={setAutoLogout} value={autoLogout}>
                    <Stack direction="row" spacing={6}>
                        <Radio value="0.083333">Test Value 5 Seconds</Radio>
                        <Radio value="10">10 minutes</Radio>
                        <Radio value="20">20 minutes</Radio>
                        <Radio value="30">30 minutes</Radio>
                    </Stack>
                </RadioGroup>
                <Text>Current Setting: {autoLogout} minutes</Text>
                <Button colorScheme="blue" onClick={handleUpdateLogout}>
                    Update Auto Logout
                </Button>
            </Stack>
        </Container>
    )
}
export default ChangePassword