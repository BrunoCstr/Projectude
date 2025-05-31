"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Step1Form,
  type Step1FormData,
} from "@/components/onboarding/step1-form";
import {
  Step2Form,
  type Step2FormData,
} from "@/components/onboarding/step2-form";
import { Briefcase } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { updateUserOnboardingData } from "@/actions/user-actions"; // Import the action
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

// Placeholder logo
const ProjectudeLogo = () => (
  <div className="flex items-center justify-center gap-2 mb-8">
    <Briefcase className="h-8 w-8 text-primary" />
    <span className="text-2xl font-bold text-foreground">Projectude</span>
  </div>
);

export default function OnboardingPage() {
  const [step, setStep] = React.useState(1);
  const [step1Data, setStep1Data] = React.useState<Step1FormData | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const t = useTranslations("onboarding");

  const handleStep1Submit = (data: Step1FormData) => {
    setStep1Data(data);
    setStep(2);
  };

  const handleStep2Submit = async (data: Step2FormData) => {
    if (!step1Data) {
      // Handle error, maybe redirect back to step 1 or show an error
      console.error("Step 1 data is missing!");
      toast({
        variant: "destructive",
        title: t("errors.missingStep1Data.title"),
        description: t("errors.missingStep1Data.description"),
      });
      setStep(1);
      return;
    }

    const onboardingData = {
      phone: step1Data.phone,
      country: step1Data.country,
      state: step1Data.state,
      city: step1Data.city,
      userType: data.userType,
    };

    if (!user) {
      toast({
        variant: "destructive",
        title: t("errors.notLoggedIn.title"),
        description: t("errors.notLoggedIn.description"),
      });
      return;
    }

    try {
      // Call the server action to update user data
      const result = await updateUserOnboardingData(user.uid, onboardingData);
      if (result.success) {
        toast({
          title: t("success.title"),
          description: t("success.description"),
        });
        router.push("/dashboard"); // Redirect to dashboard on success
      } else {
        toast({
          variant: "destructive",
          title: t("errors.saveFailed.title"),
          description: result.message || t("errors.saveFailed.description"),
        });
      }
    } catch (error) {
      console.error("Onboarding submission error:", error);
      toast({
        variant: "destructive",
        title: t("errors.unexpected.title"),
        description: t("errors.unexpected.description"),
      });
    }
  };

  const handlePrevious = () => {
    setStep(1);
  };

  const progressValue = step === 1 ? 50 : 100;

  return (
    <div className="flex flex-col items-center justify-center bg-muted/30 dark:bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <ProjectudeLogo />

        <Card className="shadow-lg border border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              {t("title")} ({step}/2)
            </CardTitle>
            <CardDescription>{t("description")}</CardDescription>
            <Progress value={progressValue} className="w-full h-2 mt-4" />
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <Step1Form
                onSubmit={handleStep1Submit}
                initialData={step1Data ?? undefined}
              />
            )}
            {step === 2 && (
              <Step2Form
                onSubmit={handleStep2Submit}
                onPrevious={handlePrevious}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
