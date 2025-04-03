import { useState } from "react";
import { Box, Button, FormControl, FormLabel, Textarea, VStack, useToast } from "@chakra-ui/react";
import { FaqService } from "../../client/sdk.gen";

const AskQuestion = () => {
  const [question, setQuestion] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!question.trim()) {
      toast({
        title: "Error",
        description: "Question cannot be empty.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await FaqService.createFaq({
        requestBody: { question, answer: null },
      });

      toast({
        title: "Success",
        description: "Your question has been submitted!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setQuestion("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit question. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box p={4} borderWidth={1} borderRadius="lg" w="full">
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>Your Question</FormLabel>
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            size="md"
          />
        </FormControl>
        <Button colorScheme="yellow" onClick={handleSubmit} isLoading={isSubmitting}>
          Submit Question
        </Button>
      </VStack>
    </Box>
  );
};

export default AskQuestion;
