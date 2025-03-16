import { useEffect, useState } from "react";
import { Box, Text, VStack, Spinner, Alert, AlertIcon } from "@chakra-ui/react";

interface FAQ {
  id: number;
  question: string;
  answer: string | null;
}

const FAQList = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await fetch("/api/faqs");
        if (!response.ok) {
          throw new Error("Failed to fetch FAQs");
        }
        const data: FAQ[] = await response.json();
        setFaqs(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" mt={4}>
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <VStack spacing={4} align="stretch" p={4}>
      {faqs.length > 0 ? (
        faqs.map((faq) => (
          <Box key={faq.id} p={4} borderWidth={1} borderRadius="lg">
            <Text fontWeight="bold">{faq.question}</Text>
            {faq.answer ? (
              <Text mt={2}>{faq.answer}</Text>
            ) : (
              <Text mt={2} fontStyle="italic" color="gray.500">
                No answer yet
              </Text>
            )}
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
