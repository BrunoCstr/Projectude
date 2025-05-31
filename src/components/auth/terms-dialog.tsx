
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns'; // To format the current date
import { useTranslations } from 'next-intl';

interface TermsDialogProps {
  children: React.ReactNode; // The trigger element (e.g., link)
  title: string; // Title for the dialog (Terms of Use or Privacy Policy)
  content: React.ReactNode; // The content to display
}

export function TermsDialog({ children, title, content }: TermsDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      {/* Adjust max-width and max-height for better readability */}
      <DialogContent className="sm:max-w-2xl p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          {/* Optional: Add a short description if needed */}
          {/* <DialogDescription>Review our terms and conditions below.</DialogDescription> */}
        </DialogHeader>
        {/* Use ScrollArea for potentially long content */}
        <ScrollArea className="max-h-[60vh] p-6">
           <div className="prose dark:prose-invert max-w-none text-sm text-foreground/90">
             {content}
           </div>
        </ScrollArea>
        <DialogFooter className="p-4 border-t bg-muted/50 sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Component to render the Terms and Conditions content
const TermsAndConditionsContent = () => {
  const t = useTranslations('terms-condition');
  const currentDate = format(new Date(), 'dd/MM/yyyy');

  return (
    <>
      <p className="text-xs text-muted-foreground mb-4">
        {t('lastUpdateLabel')} {currentDate}
      </p>

      <h2 className="text-lg font-semibold mb-2">
        {t('welcomeTitle')}
      </h2>

      <p>{t('introText')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section1Title')}
      </h3>
      <p>{t('section1Text')}</p>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('section1Item1')}</li>
        <li>{t('section1Item2')}</li>
        <li>{t('section1Item3')}</li>
        <li>{t('section1Item4')}</li>
        <li>{t('section1Item5')}</li>
        <li>{t('section1Item6')}</li>
        <li>{t('section1Item7')}</li>
      </ul>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section2Title')}
      </h3>
      <p>{t('section2Text1')}</p>
      <p>{t('section2Text2')}</p>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('section2Item1')}</li>
        <li>{t('section2Item2')}</li>
        <li>{t('section2Item3')}</li>
      </ul>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section3Title')}
      </h3>
      <p>{t('section3Text1')}</p>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('section3Item1')}</li>
        <li>{t('section3Item2')}</li>
      </ul>
      <p>{t('section3Text2')}</p>
      <p>{t('section3Text3')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section4Title')}
      </h3>
      <p>{t('section4Text1')}</p>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('section4Item1')}</li>
        <li>{t('section4Item2')}</li>
        <li>{t('section4Item3')}</li>
        <li>{t('section4Item4')}</li>
      </ul>
      <p>{t('section4Text2')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section5Title')}
      </h3>
      <p>{t('section5Text')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section6Title')}
      </h3>
      <p>{t('section6Text')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section7Title')}
      </h3>
      <p>{t('section7Text')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section8Title')}
      </h3>
      <p>{t('section8Text')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section9Title')}
      </h3>
      <p>{t('section9Text')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section10Title')}
      </h3>
      <p>{t('section10Text')}</p>
    </>
  );
};

// Component to render the Cookie Policy content
const CookiePolicyContent = () => {
  const t = useTranslations('cookies-policy');
  const currentDate = format(new Date(), 'dd/MM/yyyy');

  return (
    <>
      <p className="text-xs text-muted-foreground mb-4">
        {t('lastUpdateLabel')} {currentDate}
      </p>

      <h2 className="text-lg font-semibold mb-2">
        {t('title')}
      </h2>

      <p>{t('intro')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section1Title')}
      </h3>
      <p>{t('section1Text')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section2Title')}
      </h3>

      <h4 className="text-sm font-medium mt-2 mb-1">
        {t('strictlyNecessaryTitle')}
      </h4>
      <p>{t('strictlyNecessaryText')}</p>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('strictlyNecessaryItem1')}</li>
        <li>{t('strictlyNecessaryItem2')}</li>
        <li>{t('strictlyNecessaryItem3')}</li>
      </ul>

      <h4 className="text-sm font-medium mt-2 mb-1">
        {t('performanceTitle')}
      </h4>
      <p>{t('performanceText')}</p>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('performanceItem1')}</li>
        <li>{t('performanceItem2')}</li>
      </ul>
      <p>{t('performanceExample')}</p>

      <h4 className="text-sm font-medium mt-2 mb-1">
        {t('functionalityTitle')}
      </h4>
      <p>{t('functionalityText')}</p>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('functionalityItem1')}</li>
        <li>{t('functionalityItem2')}</li>
        <li>{t('functionalityItem3')}</li>
      </ul>

      <h4 className="text-sm font-medium mt-2 mb-1">
        {t('marketingTitle')}
      </h4>
      <p>{t('marketingText')}</p>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('marketingItem1')}</li>
        <li>{t('marketingItem2')}</li>
      </ul>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('managementTitle')}
      </h3>
      <p>{t('managementText')}</p>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('managementItem1')}</li>
        <li>{t('managementItem2')}</li>
        <li>{t('managementItem3')}</li>
      </ul>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('thirdPartyTitle')}
      </h3>
      <p>{t('thirdPartyText')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('changesTitle')}
      </h3>
      <p>{t('changesText')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('contactTitle')}
      </h3>
      <p>{t('contactText')}</p>
      <p>{t('contactEmail')}</p>

      <p className="mt-4">{t('consentText')}</p>
    </>
  );
};

// Component to render the Privacy Policy content
const PrivacyPolicyContent = () => {
  const t = useTranslations('privacy-police');
  const currentDate = format(new Date(), 'dd/MM/yyyy');

  return (
    <>
      <p className="text-xs text-muted-foreground mb-4">
        {t('lastUpdateLabel')} {currentDate}
      </p>

      <h2 className="text-lg font-semibold mb-2">
        {t('title')}
      </h2>

      <p>{t('intro')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section1Title')}
      </h3>
      <p>{t('section1Text')}</p>

      <h4 className="text-sm font-medium mt-2 mb-1">
        {t('section1_1Title')}
      </h4>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('section1_1Item1')}</li>
        <li>{t('section1_1Item2')}</li>
        <li>{t('section1_1Item3')}</li>
        <li>{t('section1_1Item4')}</li>
        <li>{t('section1_1Item5')}</li>
        <li>{t('section1_1Item6')}</li>
      </ul>

      <h4 className="text-sm font-medium mt-2 mb-1">
        {t('section1_2Title')}
      </h4>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('section1_2Item1')}</li>
        <li>{t('section1_2Item2')}</li>
        <li>{t('section1_2Item3')}</li>
        <li>{t('section1_2Item4')}</li>
      </ul>

      <h4 className="text-sm font-medium mt-2 mb-1">
        {t('section1_3Title')}
      </h4>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('section1_3Item1')}</li>
        <li>{t('section1_3Item2')}</li>
        <li>{t('section1_3Item3')}</li>
      </ul>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section2Title')}
      </h3>
      <p>{t('section2Text')}</p>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('section2Item1')}</li>
        <li>{t('section2Item2')}</li>
        <li>{t('section2Item3')}</li>
        <li>{t('section2Item4')}</li>
        <li>{t('section2Item5')}</li>
        <li>{t('section2Item6')}</li>
      </ul>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section3Title')}
      </h3>
      <p>{t('section3Text')}</p>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('section3Item1')}</li>
        <li>{t('section3Item2')}</li>
        <li>{t('section3Item3')}</li>
      </ul>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section4Title')}
      </h3>
      <p>{t('section4Text')}</p>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('section4Item1')}</li>
        <li>{t('section4Item2')}</li>
        <li>{t('section4Item3')}</li>
      </ul>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section5Title')}
      </h3>
      <p>{t('section5Text')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section6Title')}
      </h3>
      <p>{t('section6Text')}</p>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('section6Item1')}</li>
        <li>{t('section6Item2')}</li>
        <li>{t('section6Item3')}</li>
        <li>{t('section6Item4')}</li>
      </ul>
      <p>{t('section6Note')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section7Title')}
      </h3>
      <p>{t('section7Text')}</p>
      <ul className="list-disc list-inside space-y-1 my-2">
        <li>{t('section7Item1')}</li>
        <li>{t('section7Item2')}</li>
        <li>{t('section7Item3')}</li>
      </ul>
      <p>{t('section7Note')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section8Title')}
      </h3>
      <p>{t('section8Text')}</p>

      <h3 className="text-base font-semibold mt-4 mb-1">
        {t('section9Title')}
      </h3>
      <p>{t('section9Text')}</p>
      <p>{t('section9Email')} <br /> {t('section9Site')}</p>

      <p className="mt-4">
        {t('finalConsent')}
      </p>
    </>
  );
};


// Export the content components separately if needed elsewhere,
// or just use them directly in the page.
export { TermsAndConditionsContent, CookiePolicyContent, PrivacyPolicyContent };



