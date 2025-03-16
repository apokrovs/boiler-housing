import { useState, useEffect } from "react";
import { Box, Text, VStack, Spinner } from "@chakra-ui/react";
import { FaqService } from "../../client/sdk.gen";

const FAQList = () => {
  const [faqs, setFaqs] = useState<{ id: string; question: string; answer: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await FaqService.getAllFaqs();

        const formattedFaqs = response.data.map((faq) => ({
          id: faq.id,
          question: faq.question,
          answer: faq.answer ?? "",
        }));

        setFaqs(formattedFaqs);
      } catch (err) {
        setError("Failed to load FAQs");
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  if (loading) return <Spinner size="xl" />;
  if (error) return <Text color="red.500">Error: {error}</Text>;

  return (
    <VStack spacing={4} align="stretch" p={4}>
      {faqs.length > 0 ? (
        faqs.map((faq) => (
          <Box key={faq.id} p={4} borderWidth={1} borderRadius="lg">
            <Text fontWeight="bold">{faq.question}</Text>
            <Text mt={2}>{faq.answer}</Text>
          </Box>
        ))
      ) : (
        <Text textAlign="center" fontStyle="italic" color="gray.500">
          No FAQs available yet.
        </Text>
      )}
    </VStack>
  );
};

export default FAQList;
