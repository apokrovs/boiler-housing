import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Text,
  Spinner,
  Center,
  useToast
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

interface LeaseAgreementViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

const LeaseAgreementViewer = ({ isOpen, onClose, fileUrl, fileName }: LeaseAgreementViewerProps) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  const isPdf = fileExtension === 'pdf';

  useEffect(() => {
    if (!isOpen || !fileUrl) return;

    setLoading(true);
    setError(null);

    // For text files, fetch the content
    if (!isPdf) {
      fetch(fileUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to load file');
          }
          return response.text();
        })
        .then(text => {
          setContent(text);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading text file:', err);
          setError('Failed to load the file. Please try again later.');
          setLoading(false);
          toast({
            title: 'Error',
            description: 'Failed to load the file',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
    } else {
      // For PDFs, we'll just show the embedded viewer
      setLoading(false);
    }
  }, [isOpen, fileUrl, isPdf, toast]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>Lease Agreement: {fileName}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {loading ? (
            <Center p={8}>
              <Spinner size="xl" />
            </Center>
          ) : error ? (
            <Text color="red.500">{error}</Text>
          ) : isPdf ? (
            <Box height="70vh" width="100%">
              <iframe
                src={`${fileUrl}#view=fitH`}
                title="Lease Agreement PDF"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
              />
            </Box>
          ) : (
            <Box
              border="1px"
              borderColor="gray.200"
              borderRadius="md"
              p={4}
              height="70vh"
              overflowY="auto"
              fontFamily="monospace"
              whiteSpace="pre-wrap"
            >
              {content}
            </Box>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default LeaseAgreementViewer;