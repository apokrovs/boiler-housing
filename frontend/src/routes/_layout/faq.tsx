import {
  Container,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs
} from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import FAQList from "../../components/FAQ/FAQList";
import AskQuestion from "../../components/FAQ/AskQuestion";
import AnswerQuestion from "../../components/FAQ/AnswerQuestion";

export const Route = createFileRoute("/_layout/faq")({
  component: FAQPage,
});

function FAQPage() {
  return (
    <Container maxW="full" p={4}>
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} p={4}>
        Frequently Asked Questions
      </Heading>
      <Tabs variant="enclosed" p={2}>
        <TabList>
          <Tab>View FAQs</Tab>
          <Tab>Ask a Question</Tab>
          <Tab>Answer a Question</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <FAQList />
          </TabPanel>
          <TabPanel>
            <AskQuestion />
          </TabPanel>
          <TabPanel>
            <AnswerQuestion />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
}
