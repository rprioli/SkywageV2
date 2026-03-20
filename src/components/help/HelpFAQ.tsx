import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { faqCategories } from './faq-data';

export function HelpFAQ() {
  return (
    <>
      {faqCategories.map((category, catIdx) => (
        <Card
          key={category.title}
          className="bg-white rounded-3xl !border-0 !shadow-none"
        >
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-brand-ink">
              {category.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <Accordion type="multiple">
              {category.items.map((item, qIdx) => (
                <AccordionItem
                  key={`cat-${catIdx}-q-${qIdx}`}
                  value={`cat-${catIdx}-q-${qIdx}`}
                >
                  <AccordionTrigger className="hover:no-underline text-brand-ink font-semibold text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
