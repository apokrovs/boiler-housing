import {Box, HStack, Image, Stack, Radio, RadioGroup, Center, Text} from "@chakra-ui/react";
import {createFileRoute} from "@tanstack/react-router";
import {useState} from "react";


export const Route = createFileRoute("/roommate-quiz")({
    component: RoommateQuiz
});

function RoommateQuiz() {
    const [cleanliness, setCleanliness] = useState("0")


    return (
        <>
            <Box
                boxShadow={'md'}
                height={"100px"}
                //background={"black"}
                width={"100%"}>
                <HStack gap={90}>
                    <Image pl={4} pt={"15px"} src={"/assets/images/BoilerHousingCropped.png"}></Image>
                </HStack>
            </Box>
            <Center>
                <Stack as={"form"} p={10} spacing={6}>
                    <Text fontSize={'2xl'}>How clean do you like to keep your space?</Text>
                    <RadioGroup value={cleanliness} onChange={setCleanliness}>
                        <Stack direction="row" spacing={6}>
                            <Radio value="0">Very Messy</Radio>
                            <Radio value="1">Somewhat Messy</Radio>
                            <Radio value="2">Neutral</Radio>
                            <Radio value="3">Somewhat Clean</Radio>
                            <Radio value="4">Very Clean</Radio>
                        </Stack>
                    </RadioGroup>
                </Stack>
            </Center>
        </>
    )
}
