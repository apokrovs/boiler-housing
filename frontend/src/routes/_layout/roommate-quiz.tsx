import {Stack, Radio, RadioGroup, Center, Text, HStack, Button} from "@chakra-ui/react";
import {createFileRoute, Link as RouterLink, useNavigate} from "@tanstack/react-router";
import {useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {UserPublic, UsersService, UserUpdateMe} from "../../client";


export const Route = createFileRoute("/_layout/roommate-quiz")({
    component: RoommateQuiz
});

function RoommateQuiz() {
    const queryClient = useQueryClient()
    const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
    const navigate = useNavigate();

    const [cleanScore, setCleanScore] = useState(currentUser?.cleanScore ?? "")
    const [visitScore, setVisitScore] = useState(currentUser?.visitScore ?? "")
    const [sleepTime, setSleepTime] = useState(currentUser?.sleepTime ?? "")
    const [pets, setPets] = useState(currentUser?.pets ?? "")
    const [smoking, setSmoking] = useState(currentUser?.smoking ?? "")
    const [alcoholScore, setAlcoholScore] = useState(currentUser?.alcoholScore ?? "")

    const updateUserMutation = useMutation({
        mutationFn: (updatedUser: UserUpdateMe) =>
            UsersService.updateUserMe({requestBody: updatedUser}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["currentUser"]})
            navigate({to: "/roommates"});
        },
        onError: (error) => {
            console.error("Failed to update auto logout time.", error)
            alert("Failed to update auto logout time.")
        }
    })


    const handleSubmitQuiz = () => {
        if (currentUser) {
            const updatedUser = {
                ...currentUser,
                hasTakenRoommateQuiz: true,
                cleanScore: Number(cleanScore),
                visitScore: Number(visitScore),
                sleepTime: Number(sleepTime),
                pets: Number(pets),
                smoking: Number(smoking),
                alcoholScore: Number(alcoholScore)
            }
            updateUserMutation.mutate(updatedUser)
        }
    };


    return (
        <>
            <Center>
                <Stack p={10} spacing={6}>
                    <Text color={"#CEB888"} fontSize={'2xl'}>How clean do you like to keep your space?</Text>
                    <RadioGroup value={cleanScore.toString()} onChange={setCleanScore}>
                        <Stack direction="row" spacing={6}>
                            <Radio value="0">Very Messy</Radio>
                            <Radio value="1">Somewhat Messy</Radio>
                            <Radio value="2">Neutral</Radio>
                            <Radio value="3">Somewhat Clean</Radio>
                            <Radio value="4">Very Clean</Radio>
                        </Stack>
                    </RadioGroup>
                    <Text color={"#CEB888"} fontSize={'2xl'}>How often do you like to have visitors?</Text>
                    <RadioGroup value={visitScore.toString()} onChange={setVisitScore}>
                        <Stack direction="row" spacing={6}>
                            <Radio value="0">Very Often</Radio>
                            <Radio value="1">Somewhat Often</Radio>
                            <Radio value="2">Neutral</Radio>
                            <Radio value="3">Somewhat Often</Radio>
                            <Radio value="4">Very Often</Radio>
                        </Stack>
                    </RadioGroup>
                    <Text color={"#CEB888"} fontSize={'2xl'}>When do you normally like to go to sleep?</Text>
                    <RadioGroup value={sleepTime.toString()} onChange={setSleepTime}>
                        <Stack direction="row" spacing={6}>
                            <Radio value="0">Before 10:00pm</Radio>
                            <Radio value="1">10:00-11:00pm</Radio>
                            <Radio value="2">11:00pm-12:00am</Radio>
                            <Radio value="3">12:00am-1:00am</Radio>
                            <Radio value="4">After 1:00am</Radio>
                        </Stack>
                    </RadioGroup>
                    <Text color={"#CEB888"} fontSize={'2xl'}>Are you okay to live with pets?</Text>
                    <RadioGroup value={pets.toString()} onChange={setPets}>
                        <Stack direction="row" spacing={6}>
                            <Radio value="0">Yes</Radio>
                            <Radio value="1">No</Radio>
                        </Stack>
                    </RadioGroup>
                    <Text color={"#CEB888"} fontSize={'2xl'}>Are you okay with a roommate who smokes?</Text>
                    <RadioGroup value={smoking.toString()} onChange={setSmoking}>
                        <Stack direction="row" spacing={6}>
                            <Radio value="0">Yes</Radio>
                            <Radio value="1">No</Radio>
                        </Stack>
                    </RadioGroup>
                    <Text color={"#CEB888"} fontSize={'2xl'}>How often do you drink alcohol?</Text>
                    <RadioGroup value={alcoholScore.toString()} onChange={setAlcoholScore}>
                        <Stack direction="row" spacing={6}>
                            <Radio value="0">Never</Radio>
                            <Radio value="1">Almost never</Radio>
                            <Radio value="2">Sometimes</Radio>
                            <Radio value="3">Somewhat often</Radio>
                            <Radio value="4">Very often</Radio>
                        </Stack>
                    </RadioGroup>
                    <HStack spacing={475}>
                        <Button as={RouterLink} to={'/roommates'}>Back</Button>
                        <Button bg={"#CEB888"} onClick={handleSubmitQuiz}>Submit</Button>
                    </HStack>
                </Stack>
            </Center>
        </>
    )
}
