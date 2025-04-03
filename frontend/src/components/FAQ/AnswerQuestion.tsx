import { useEffect, useState } from "react";
import { Box, Button, FormControl, FormLabel, Select, Textarea, VStack, useToast, Spinner, Text } from "@chakra-ui/react";
import { FaqService } from "../../client/sdk.gen";

const AnswerQuestion = () => {
  const [unansweredQuestions, setUnansweredQuestions] = useState<{ id: string; question: string }[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const toast = useToast();

  useEffect(() => {
    const fetchUnansweredQuestions = async () => {
      try {
        const response = await FaqService.getAllFaqs();
        const filteredQuestions = response.data.filter((faq) => !faq.answer);
        setUnansweredQuestions(filteredQuestions);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load unanswered questions.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUnansweredQuestions();
  }, []);

  const handleSubmit = async () => {
    if (!selectedQuestionId || !answer.trim()) {
      toast({
        title: "Error",
        description: "Please select a question and provide an answer.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      await FaqService.updateFaq({
        faqId: selectedQuestionId,
        requestBody: { answer },
      });

      toast({
        title: "Success",
        description: "Question answered successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Remove the answered question from the list
      setUnansweredQuestions(unansweredQuestions.filter((q) => q.id !== selectedQuestionId));
      setSelectedQuestionId("");
      setAnswer("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit the answer. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={4} borderWidth={1} borderRadius="lg" w="full">
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>Select a Question to Answer</FormLabel>
          {loading ? (
            <Spinner size="md" />
          ) : unansweredQuestions.length > 0 ? (
            <Select placeholder="Select a question" value={selectedQuestionId} onChange={(e) => setSelectedQuestionId(e.target.value)}>
              {unansweredQuestions.map((faq) => (
                <option key={faq.id} value={faq.id}>
                  {faq.question}
                </option>
              ))}
            </Select>
          ) : (
            <Text color="gray.500">No unanswered questions available.</Text>
          )}
        </FormControl>

        {selectedQuestionId && (
          <FormControl>
            <FormLabel>Your Answer</FormLabel>
            <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer here..." />
          </FormControl>
        )}

        <Button colorScheme="yellow" onClick={handleSubmit} isLoading={submitting} isDisabled={!selectedQuestionId || !answer.trim()}>
          Submit Answer
        </Button>
      </VStack>
    </Box>
  );
};

export default AnswerQuestion;
