"use client"; // Make this a client component

import * as React from "react"; // Import React and hooks
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, Hash, FileQuestion, XCircle } from "lucide-react"; // Added XCircle
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

export default function HelpCenterPage() {
  const t = useTranslations("helpCenter");

  // Updated Mock Data for Help Topics reflecting current functionalities
  const popularTopics = [
    {
      id: "topic1",
      name: t("topics.topic1.name"),
      description: t("topics.topic1.description"),
      steps: [
        t("topics.topic1.step1"),
        t("topics.topic1.step2"),
        t("topics.topic1.step3"),
        t("topics.topic1.step4"),
        t("topics.topic1.step5"),
      ],
    },
    {
      id: "topic2",
      name: t("topics.topic2.name"),
      description: t("topics.topic2.description"),
      steps: [
        t("topics.topic2.step1"),
        t("topics.topic2.step2"),
        t("topics.topic2.step3"),
        t("topics.topic2.step4"),
        t("topics.topic2.step5"),
      ],
    },
    {
      id: "topic3",
      name: t("topics.topic3.name"),
      description: t("topics.topic3.description"),
      steps: [
        t("topics.topic3.step1"),
        t("topics.topic3.step2"),
        t("topics.topic3.step3"),
        t("topics.topic3.step4"),
        t("topics.topic3.step5"),
        t("topics.topic3.step6"),
        t("topics.topic3.step7"),
      ],
    },
    {
      id: "topic4",
      name: t("topics.topic4.name"),
      description: t("topics.topic4.description"),
      steps: [
        t("topics.topic4.step1"),
        t("topics.topic4.step2"),
        t("topics.topic4.step3"),
      ],
    },
    {
      id: "topic5",
      name: t("topics.topic5.name"),
      description: t("topics.topic5.description"),
      steps: [t("topics.topic5.step1"), t("topics.topic5.step2")],
    },
    {
      id: "topic6",
      name: t("topics.topic6.name"),
      description: t("topics.topic6.description"),
      steps: [t("topics.topic6.step1"), t("topics.topic6.step2")],
    },
    {
      id: "topic7",
      name: t("topics.topic7.name"),
      description: t("topics.topic7.description"),
      steps: [
        t("topics.topic7.step1"),
        t("topics.topic7.step2"),
        t("topics.topic7.step3"),
        t("topics.topic7.step4"),
      ],
    },
  ];

  // Updated Mock Data for FAQs reflecting current functionalities
  const faqs = [
    {
      id: "faq1",
      question: t("faqs.faq1.question"),
      answer: t("faqs.faq1.answer"),
    },
    {
      id: "faq2",
      question: t("faqs.faq2.question"),
      answer: t("faqs.faq2.answer"),
    },
    {
      id: "faq3",
      question: t("faqs.faq3.question"),
      answer: t("faqs.faq3.answer"),
    },
    {
      id: "faq4",
      question: t("faqs.faq4.question"),
      answer: t("faqs.faq4.answer"),
    },
    {
      id: "faq5",
      question: t("faqs.faq5.question"),
      answer: t("faqs.faq5.answer"),
    },
    {
      id: "faq6",
      question: t("faqs.faq6.question"),
      answer: t("faqs.faq6.answer"),
    },
    {
      id: "faq7",
      question: t("faqs.faq7.question"),
      answer: t("faqs.faq7.answer"),
    },
  ];

  // Define types for the data
  type Topic = (typeof popularTopics)[0];
  type Faq = (typeof faqs)[0];

  const [searchQuery, setSearchQuery] = React.useState("");
  const [filteredTopics, setFilteredTopics] =
    React.useState<Topic[]>(popularTopics);
  const [filteredFaqs, setFilteredFaqs] = React.useState<Faq[]>(faqs);

  // Function to handle search input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Filter topics and FAQs based on search query
  React.useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase().trim();

    if (!lowerCaseQuery) {
      setFilteredTopics(popularTopics);
      setFilteredFaqs(faqs);
      return;
    }

    const filterTopics = (topic: Topic): boolean => {
      return (
        topic.name.toLowerCase().includes(lowerCaseQuery) ||
        topic.description.toLowerCase().includes(lowerCaseQuery) ||
        topic.steps.some((step) => step.toLowerCase().includes(lowerCaseQuery))
      );
    };

    const filterFaqs = (faq: Faq): boolean => {
      return (
        faq.question.toLowerCase().includes(lowerCaseQuery) ||
        faq.answer.toLowerCase().includes(lowerCaseQuery)
      );
    };

    setFilteredTopics(popularTopics.filter(filterTopics));
    setFilteredFaqs(faqs.filter(filterFaqs));
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  const hasSearchResults = filteredTopics.length > 0 || filteredFaqs.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight text-center">
        {t("page.title")}
      </h1>
      <p className="text-lg text-muted-foreground text-center">
        {t("page.subtitle")}
      </p>

      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder={t("page.search.placeholder")}
          className="pl-10 h-11 text-base pr-10" // Add padding-right for clear button
          value={searchQuery}
          onChange={handleSearchChange}
          aria-label="Search help articles"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={clearSearch}
            aria-label={t("search.clear")}
          >
            <XCircle className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Display Search Results or Default Content */}
      {searchQuery && !hasSearchResults && (
        <Card className="shadow-md rounded-lg text-center p-8 bg-card">
          <CardContent className="flex flex-col items-center justify-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">{t("page.noResults.title")}</p>
            <p className="text-muted-foreground mt-1">
              {t("page.noResults.description")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Popular Topics Section */}
      {(hasSearchResults || !searchQuery) && filteredTopics.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            {searchQuery
              ? t("sections.topics.titleSearch")
              : t("sections.topics.titleDefault")}
          </h2>
          {/* Adjusted flex-wrap for better spacing on mobile */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {filteredTopics.map((topic) => (
              <Dialog key={topic.id}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="shadow-sm hover:shadow-md transition-shadow text-xs sm:text-sm"
                  >
                    {topic.name}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                  {" "}
                  {/* Adjusted width and height */}
                  <DialogHeader>
                    <DialogTitle>{topic.name}</DialogTitle>
                    <DialogDescription>{topic.description}</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <h4 className="font-semibold mb-2 text-sm">
                      {t("sections.topics.stepsTitle")}
                    </h4>
                    <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                      {" "}
                      {/* Increased spacing */}
                      {topic.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </section>
      )}

      {/* FAQs Section */}
      {(hasSearchResults || !searchQuery) && filteredFaqs.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-primary" />
            {searchQuery ? t("faqs.titleSearch") : t("sections.faqs.titleDefault")}
          </h2>
          <Card className="shadow-md rounded-lg">
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq) => (
                  <AccordionItem
                    value={`item-${faq.id}`}
                    key={faq.id}
                    className="border-b last:border-b-0"
                  >
                    {/* Adjusted padding for mobile */}
                    <AccordionTrigger className="px-4 sm:px-6 py-4 text-left hover:no-underline font-medium text-sm sm:text-base">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 sm:px-6 pb-4 pt-0 text-muted-foreground text-sm sm:text-base">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
