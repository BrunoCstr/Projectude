"use client"; // Make this a client component for state management

import * as React from "react"; // Import React and hooks
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Import RadioGroup components
import {
  CreditCard,
  Trash2,
  Star,
  PlusCircle,
  UserCog,
  CreditCard as CreditCardIcon, // Renamed import
  Settings2,
  BellRing,
  Brush,
  Save,
  UserPlus,
  FileEdit,
  MessageSquare,
  CircleCheck,
  Mail,
  User, // Added User icon
  AtSign, // Added AtSign icon
  MapPin, // Added MapPin icon
  Home, // Added Home icon (for neighborhood/street)
  Globe, // Added Globe icon (for Country)
  Building, // Added Building icon (for State/City)
  Loader2, // Added Loader2 for username check
  Check, // Added Check icon
  X, // Added X icon
  Package, // Icon for Plan
  Zap, // Icon for features/upgrade
  History, // Icon for payment history
  Sparkles, // Icon for Premium features
  LockKeyhole, // Icon for Free restrictions
  FileBadge, // Added FileBadge icon for payment ID
  Languages, // Icon for Language
  Currency, // Icon for Currency
  DollarSign,
  Euro,
  // Percent, // Removed Percent icon import
  // Import specific currency icons if available or use generic
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast"; // Import toast
import { cn } from "@/lib/utils"; // Import cn
import { ChangePasswordDialog } from "@/components/settings/change-password-dialog"; // Import the new dialog
import { AddPaymentMethodDialog } from "@/components/settings/add-payment-method-dialog"; // Import AddPaymentMethodDialog
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select components
import { savePreferences, updateUserProfile } from "@/services/settings";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { UserPreferences } from "@/services/settings";
import { useTranslations } from "next-intl";
import {
  addPaymentMethodFlow,
  deletePaymentMethodFlow,
  setPrimaryPaymentMethodFlow,
} from "@/services/paymentMethods";
import {
  setDoc,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { getInitializedFirestore } from "@/lib/firebase";
import { fetchPaymentMethods } from "@/services/payment-method-firestore";
import {
  fetchPaymentHistory,
  PaymentHistoryItem,
} from "@/services/payment-history";
import { addCardToFirestore } from "@/services/payment-method-firestore";
import { useUserCurrency } from "@/hooks/useUserCurrency";
import {
  getAuth,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
} from "firebase/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import type { User as FirebaseUser } from "firebase/auth";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUB_KEY!);

// --- Pricing ---
const prices = {
  monthly: 3.9,
  annually: 39.9,
  biannually: 69.9,
};

// --- Calculate Discounts ---
const monthlyCostAnnual = prices.monthly * 12;
const annualDiscountAmount = monthlyCostAnnual - prices.annually;
const annualDiscountPercent = Math.round(
  (annualDiscountAmount / monthlyCostAnnual) * 100
);

const monthlyCostBiannual = prices.monthly * 24;
const biannualDiscountAmount = monthlyCostBiannual - prices.biannually;
const biannualDiscountPercent = Math.round(
  (biannualDiscountAmount / monthlyCostBiannual) * 100
);

// Helper to format currency
const formatPrice = (value: number, currency: string) => {
  const userCurrency = currency ?? "BRL";

  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: userCurrency,
  });
};

// Type for saved card data
interface SavedCard {
  id: string;
  last4: string;
  expiry: string;
  isPrimary: boolean;
  brand: string;
}

// Mock function for username availability check
async function checkUsernameAvailability(username: string): Promise<boolean> {
  if (!username) return false; // Cannot check empty username
  console.log(`Checking username availability for: ${username}`);
  await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate network delay
  // Simple mock logic: usernames containing 'admin' or 'test' are unavailable
  const unavailable = ["admin", "test", "root", "user"];
  const isAvailable = !unavailable.some((u) =>
    username.toLowerCase().includes(u)
  );
  console.log(
    `Username "${username}" is ${isAvailable ? "available" : "unavailable"}`
  );
  return isAvailable;
}

// Mock function to simulate adding a payment method
async function addPaymentMethod(cardDetails: any): Promise<SavedCard> {
  console.log("Adding payment method:", cardDetails);

  // Simulate API call
  // In a real app, validate and save to backend

  const newCard: SavedCard = {
    id: `cc-${Date.now()}`,
    last4: cardDetails.cardNumber.slice(-4),
    expiry: cardDetails.expiryDate,
    isPrimary: false, // New cards are not primary by default
    brand: cardDetails.cardNumber.startsWith("4")
      ? "Visa"
      : cardDetails.cardNumber.startsWith("5")
      ? "Mastercard"
      : "Card", // Simple brand detection
  };

  // This function should return the new card, state update is handled in the component
  console.log("Simulated payment method added:", newCard);
  return newCard;
}

export default function SettingsPage() {
  const db = getInitializedFirestore();
  const { userData } = useAuth();
  const t = useTranslations("settings");

  const [notificationPrefs, setNotificationPrefs] = React.useState({
    invite: true,
    comment_update: true,
    comment_reply: true,
    comment_status: true,
    marketing: true,
  });

  const [paymentHistory, setPaymentHistory] = React.useState<
    PaymentHistoryItem[]
  >([]);

  React.useEffect(() => {
    fetchPaymentHistory()
      .then((history) => setPaymentHistory(history))
      .catch((err) => {
        console.error("Erro ao carregar histórico de pagamentos:", err);
        toast({
          title: t("recentlyAdd.failToLoad"),
          description: err.message,
          variant: "destructive",
        });
      });
  }, []);

  // Mock data for Plans/Billing
  const [currentPlan, setCurrentPlan] = React.useState<"Free" | "Premium">(
    (userData?.currentPlan as "Free" | "Premium") ?? "Free"
  );

  React.useEffect(() => {
    if (userData?.currentPlan) {
      setCurrentPlan(userData.currentPlan as "Free" | "Premium");
    }
  }, [userData]);

  const freeFeatures = [t("freeFeatures.f1"), t("freeFeatures.f2")];
  const premiumFeatures = [
    t("premiumFeatures.f1"),
    t("premiumFeatures.f2"),
    t("premiumFeatures.f3"),
  ];

  const { toast } = useToast();

  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const currentLocale = params.locale as string;

  const [isCheckingUsername, setIsCheckingUsername] = React.useState(false);
  const [usernameAvailable, setUsernameAvailable] = React.useState<
    boolean | null
  >(null);
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = React.useState(false); // State for saving indication

  // Campos de Account
  const [name, setName] = React.useState<string>("");
  const [username, setUsername] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");

  // Campos de endereço (exemplo)
  const [country, setCountry] = React.useState<string>("");
  const [state, setState] = React.useState<string>("");
  const [city, setCity] = React.useState<string>("");
  const [neighborhood, setNeighborhood] = React.useState<string>("");
  const [street, setStreet] = React.useState<string>("");

  // State for Options tab
  const [selectedLanguage, setSelectedLanguage] = React.useState(currentLocale); // Default to Portuguese

  const [selectedCurrency, setSelectedCurrency] = React.useState("USD"); // Default to USD

  const [showPasswordDialog, setShowPasswordDialog] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [isSavingUpdateProfile, setIsSavingUpdateProfile] =
    React.useState(false);

  // 1. Quando o perfil carregar, inicializa os estados:
  React.useEffect(() => {
    if (!userData) return;

    setSelectedCurrency(userData.preferences?.currency ?? "USD");
    setSelectedLanguage(userData.preferences?.language ?? currentLocale);
    setName(userData.displayName ?? "");
    setEmail(userData.email ?? "");
    setUsername(userData.username ?? "");
    setCountry(userData.address?.country ?? "");
    setState(userData.address?.state ?? "");
    setCity(userData.address?.city ?? "");
    setNeighborhood(userData.address?.neighborhood ?? "");
    setStreet(userData.address?.street ?? "");
  }, [userData, currentLocale]);

  // State for billing frequency
  type BillingFrequency = "monthly" | "annually" | "biannually";

  const [billingFrequency, setBillingFrequency] =
    React.useState<BillingFrequency>("monthly");

  React.useEffect(() => {
    if (
      userData?.billingFrequency === "monthly" ||
      userData?.billingFrequency === "annually" ||
      userData?.billingFrequency === "biannually"
    ) {
      setBillingFrequency(userData.billingFrequency);
    }
  }, [userData?.billingFrequency]);

  // State for saved payment methods
  const [savedCards, setSavedCards] = React.useState<SavedCard[]>([]);

  React.useEffect(() => {
    // ao montar, carrega do Firestore
    fetchPaymentMethods()
      .then((cards: any) => setSavedCards(cards))
      .catch((err: any) => {
        console.error("Erro ao buscar cartões:", err);
        toast({
          title: t("recentlyAdd.failToLoadMethods"),
          description: err.message,
          variant: "destructive",
        });
      });
  }, []);

  React.useEffect(() => {
    const fetchPrefs = async () => {
      const user = userData?.uid;
      if (!user) return;

      const docSnap = await getDoc(doc(db, "users", user));
      const prefs = docSnap.data()?.notificationPreferences;
      if (prefs) setNotificationPrefs((prev) => ({ ...prev, ...prefs }));
    };

    fetchPrefs();
  }, [userData]);

  // Debounce username check
  React.useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (username.trim()) {
      // Only check if username is not just whitespace
      setIsCheckingUsername(true);
      setUsernameAvailable(null); // Reset availability status
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          const available = await checkUsernameAvailability(username);
          setUsernameAvailable(available);
        } catch (error) {
          console.error("Username check failed:", error);
          setUsernameAvailable(null); // Indicate error or unknown state
          toast({
            variant: "destructive",
            title: t("account.errors.usernameUnavailable"),
            description: t("account.errors.usernameUnavailableDescription"),
          });
        } finally {
          setIsCheckingUsername(false);
        }
      }, 800); // 800ms debounce
    } else {
      setIsCheckingUsername(false);
      setUsernameAvailable(null); // No check needed for empty/whitespace username
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [username, toast]);

  // Mock handlers for saving changes (replace with actual logic)
  const handleSaveAccount = async (password: string) => {
    try {
      setIsSaving(true);
      setIsSavingUpdateProfile(true);

      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const hasEmailChanged = currentUser.email !== email;

      // 2) Se mudou o e-mail, usa o método nativo e dispara verificação
      if (hasEmailChanged) {
        // 1) Reautentica
        const credential = EmailAuthProvider.credential(
          currentUser.email!,
          password
        );
        await reauthenticateWithCredential(currentUser, credential);

        await verifyBeforeUpdateEmail(currentUser, email, {
          url: "https://app.projectude.com",
          handleCodeInApp: true,
        });

        toast({
          title: t("almostThere"),
          description: t("sendLink"),
        });
      }

      // 3) Atualiza os outros dados no Firestore
      if (!userData?.uid) return;
      await updateUserProfile(userData.uid, {
        name,
        username,
        email,
        address: { country, state, city, neighborhood, street },
      });

      toast({
        title: t("account.actions.success.title"),
        description: t("account.actions.success.description"),
      });
    } catch (error: any) {
      console.error("Erro ao salvar conta:", error);
      toast({
        variant: "destructive",
        title: t("account.actions.error.title"),
        description:
          error.code === "auth/operation-not-allowed"
            ? "Não foi possível alterar o e-mail antes de verificar o novo endereço."
            : t("account.actions.error.description"),
      });
    } finally {
      setIsSaving(false);
      setIsSavingUpdateProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!userData?.uid) return;
    setIsSaving(true);

    const preferencesData: UserPreferences = {
      preferences: {
        language: selectedLanguage,
        currency: selectedCurrency,
      },
    };

    try {
      // Persiste as preferências no perfil do usuário
      await savePreferences(userData.uid, preferencesData);

      const pathWithoutLocale = pathname.replace(`/${currentLocale}`, "");

      // Se mudou o idioma, substitua a rota pelo novo locale
      if (selectedLanguage !== currentLocale) {
        router.replace(pathWithoutLocale, { locale: selectedLanguage });
      }

      console.log("Saving preferences:", {
        language: selectedLanguage,
        currency: selectedCurrency,
      });
      toast({
        title: t("account.preferences.saveSuccess.title"),
        description: `${t(
          "account.preferences.saveSuccess.descriptionLanguage"
        )} ${selectedLanguage}, ${t(
          "account.preferences.saveSuccess.descriptionCurrency"
        )} ${selectedCurrency} .`,
      });
    } catch (e) {
      console.error(
        "Erro ao salvar o documento ",
        {
          language: selectedLanguage,
          currency: selectedCurrency,
        },
        e
      );
      toast({
        title: t("account.preferences.saveError.title"),
        description: t("account.preferences.saveError.description"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);

    try {
      const uid = userData?.uid;
      if (!uid) throw new Error("Usuário não autenticado.");

      const preferences = { ...notificationPrefs }; // usa o state atual

      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        notificationPreferences: preferences,
      });

      toast({ title: t("recentlyAdd.preferencesSave") });
    } catch (error: any) {
      console.error("Erro ao salvar preferências:", error);
      toast({
        title: t("recentlyAdd.errorToSavePreferences"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleJoinFree = async () => {
    if (!userData?.uid) {
      toast({ title: t("recentlyAdd.userNotAuth"), variant: "destructive" });
      return;
    }

    const subscriptionId = userData.subscriptionId;

    try {
      const res = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }), // se precisar do uid
      });
      if (!res.ok) throw new Error("Falha ao cancelar assinatura");

      // 1) Atualiza Firestore: plano e data de mudança
      await updateDoc(doc(db, "users", userData.uid), {
        currentPlan: "Free",
        subscriptionId: null, // opcional: limpa o subscriptionId
        planChangedAt: serverTimestamp(),
      });

      // 2) Atualiza imediatamente a UI
      setCurrentPlan("Free");

      toast({
        title: t("account.preferences.notifications.planFree.title"),
        description: t(
          "account.preferences.notifications.planFree.description"
        ),
      });

      // 3) Opcional: refaz dados do usuário
      router.refresh();
    } catch (err: any) {
      toast({
        title: t("recentlyAdd.error"),
        description: err.message || t("recentlyAdd.NotPossibleToMigrate"),
        variant: "destructive",
      });
    }
  };

  const handleJoinPremium = async () => {
    if (!userData?.uid) {
      toast({ title: t("recentlyAdd.userNotAuth"), variant: "destructive" });
      return;
    }

    try {
      // 1) Cria sessão no Stripe + pega URL e sessionId
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: userData.uid, billingFrequency }),
      });
      const data = (await res.json()) as {
        url?: string;
        sessionId?: string;
        error?: string;
      };

      if (!data.url || !data.sessionId) {
        throw new Error(data.error || "Erro ao criar sessão de Checkout");
      }

      const { url, sessionId } = data;

      // 2) Registra no Firestore
      await setDoc(doc(db, "users", userData.uid, "transactions", sessionId), {
        sessionId,
        billingFrequency,
        status: "pending",
        createdAt: serverTimestamp(),
        checkoutUrl: url,
      });

      toast({
        title: t("recentlyAdd.premiumPlanSelected"),
        description: t("recentlyAdd.premiumPlanSelectedDescription"),
      });

      // 4) Redireciona para o Stripe Checkout
      window.location.href = url;
    } catch (err: any) {
      console.error("handleJoinPremium:", err);
      toast({
        title: t("recentlyAdd.checkoutError"),
        description: err.message || t("recentlyAdd.checkoutErrorDescription"),
        variant: "destructive",
      });
    }
  };

  const handleSetPrimaryCard = async (cardId: string) => {
    await setPrimaryPaymentMethodFlow(cardId);

    // opcional: atualizar localmente
    setSavedCards((prev) =>
      prev
        .map((c) => ({ ...c, isPrimary: c.id === cardId }))
        .sort((a, b) => (a.isPrimary ? -1 : b.isPrimary ? 1 : 0))
    );
  };

  const handleDeleteCard = async (cardId: string) => {
    await deletePaymentMethodFlow(cardId);

    // opcional: filtrar savedCards localmente ou recarregar do Firestore
    setSavedCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  const handlePaymentMethodAdded = async (newCard: SavedCard) => {
    setSavedCards((prev) => {
      const isFirst = prev.length === 0;

      const updated = [
        {
          ...newCard,
          isPrimary: isFirst,
        },
        ...prev.map((c) => ({
          ...c,
          isPrimary: isFirst ? false : c.isPrimary,
        })),
      ];

      return updated.sort((a, b) => (a.isPrimary ? -1 : b.isPrimary ? 1 : 0));
    });
  };

  let userCurrency = useUserCurrency();

  const auth = getAuth();
  const user = auth.currentUser;

  return (
    <>
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirme sua senha</DialogTitle>
            <DialogDescription>
              Para salvar as alterações da sua conta, digite sua senha atual.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Label htmlFor="confirm-password">Senha atual</Label>
            <Input
              id="confirm-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
            />

            <div className="flex justify-end pt-2">
              <Button
                disabled={!password || isSavingUpdateProfile}
                onClick={() => {
                  setShowPasswordDialog(false);
                  handleSaveAccount(password); // passa a senha
                }}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSaving
                  ? t("account.actions.save.saving")
                  : t("account.actions.save.confirmPassword")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>

        <Tabs defaultValue="account" className="w-full">
          {/* Use grid-cols-2 on small screens, grid-cols-3 on medium, and grid-cols-5 on large */}
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 h-auto p-1">
            <TabsTrigger
              value="account"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center gap-1.5"
            >
              <UserCog className="h-4 w-4 flex-shrink-0" />{" "}
              {/* Keep icon visible */}
              <span className="truncate">{t("tabs.account")}</span>{" "}
              {/* Allow text truncation */}
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center gap-1.5"
            >
              <CreditCardIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t("tabs.billing")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="options"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center gap-1.5"
            >
              <Settings2 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t("tabs.options")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center gap-1.5"
            >
              <BellRing className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t("tabs.notifications")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center gap-1.5"
            >
              <Brush className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t("tabs.appearance")}</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Settings Tab */}
          <TabsContent value="account">
            <Card className="shadow-md rounded-lg mt-4">
              <CardHeader>
                <CardTitle>{t("account.title")}</CardTitle>
                <CardDescription>{t("account.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name Field */}
                  <div className="relative">
                    <Label htmlFor="name">{t("account.fields.name")}</Label>
                    <User className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      placeholder={t("account.fields.namePlaceholder")}
                      className="pl-9"
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSaving}
                    />{" "}
                    {/* Enable input */}
                  </div>
                  {/* Email Field (Still Disabled) */}
                  <div className="relative">
                    <Label htmlFor="email">{t("account.fields.email")}</Label>
                    <Mail className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={
                        !user?.emailVerified
                          ? "Verifique seu e-mail antes de alterar o endereço."
                          : email
                      }
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("account.fields.emailPlaceholder")}
                      className="pl-9"
                      disabled={isSaving || !user?.emailVerified}
                    />
                  </div>
                </div>
                {/* Username Field with Availability Check */}
                <div className="relative">
                  <Label htmlFor="username">
                    {t("account.fields.username")}
                  </Label>
                  <AtSign className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder={t("account.fields.usernamePlaceholder")}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9 pr-10" // Add padding-right for indicator
                    disabled={isSaving} // Disable while saving account changes
                  />
                  <div className="absolute right-3 top-9 h-4 w-4">
                    {isCheckingUsername ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : usernameAvailable === true ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : usernameAvailable === false ? (
                      <X className="h-4 w-4 text-destructive" />
                    ) : null}
                  </div>
                  {usernameAvailable === false && (
                    <p className="text-xs text-destructive mt-1">
                      {t("account.fields.usernameError")}
                    </p>
                  )}
                </div>
                {/* Change Password Button triggering the Dialog */}
                <div>
                  <ChangePasswordDialog />
                </div>
                <Separator />
                <div>
                  <Label>{t("account.fields.address")}</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {/* Country */}
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t("account.fields.country")}
                        className="pl-9"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                    {/* State/Province */}
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t("account.fields.state")}
                        className="pl-9"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                    {/* City */}
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t("account.fields.city")}
                        value={city}
                        className="pl-9"
                        onChange={(e) => setCity(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                    {/* Neighborhood */}
                    <div className="relative">
                      <Home className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t("account.fields.neighborhood")}
                        className="pl-9"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  {/* Street Address */}
                  <div className="relative mt-4">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("account.fields.street")}
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="pl-9"
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setShowPasswordDialog(true)}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSaving
                      ? t("account.actions.save.saving")
                      : t("account.actions.save.default")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans & Billing Tab - Updated */}
          <TabsContent value="billing">
            <div className="grid gap-6 mt-4">
              {/* Plan Selection Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Free Plan Card */}
                <Card
                  className={cn(
                    "shadow-md rounded-lg flex flex-col",
                    currentPlan === "Free" &&
                      "border-primary ring-2 ring-primary/50"
                  )}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5 text-muted-foreground" />{" "}
                        Free
                      </CardTitle>
                      {currentPlan === "Free" && (
                        <Badge variant="outline">{t("currentPlan")}</Badge>
                      )}
                    </div>
                    <CardDescription>{t("basicFeatures")}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {t("limitedFreatures")}
                    </p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {freeFeatures.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <LockKeyhole className="h-4 w-4 text-orange-500" />{" "}
                          {/* Or Check for available features */}
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-4">
                    <Button
                      variant={currentPlan === "Free" ? "secondary" : "outline"}
                      className="w-full"
                      onClick={handleJoinFree}
                      disabled={currentPlan === "Free"}
                    >
                      {currentPlan === "Free"
                        ? "Plano Atual"
                        : "Selecionar Free"}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Premium Plan Card - Updated with Frequency Selector */}
                <Card
                  className={cn(
                    "shadow-md rounded-lg flex flex-col",
                    currentPlan === "Premium" &&
                      "border-primary ring-2 ring-primary/50"
                  )}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" /> Premium
                      </CardTitle>
                      {currentPlan === "Premium" && (
                        <Badge variant="outline">{t("currentPlan")}</Badge>
                      )}
                    </div>
                    <CardDescription>{t("allFeatures")}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    {" "}
                    {/* Increased spacing */}
                    {/* Pricing Frequency Selector */}
                    <RadioGroup
                      value={billingFrequency ?? "monthly"}
                      onValueChange={(value: BillingFrequency) =>
                        setBillingFrequency(value)
                      }
                      className="grid grid-cols-3 gap-2" // Grid layout for options
                    >
                      {/* Monthly */}
                      <Label
                        htmlFor="monthly"
                        className={cn(
                          "cursor-pointer rounded-md border border-input p-3 text-center text-sm transition-colors hover:bg-muted/50",
                          billingFrequency === "monthly" &&
                            "border-primary ring-1 ring-primary bg-primary/5"
                        )}
                      >
                        <RadioGroupItem
                          value="monthly"
                          id="monthly"
                          className="sr-only"
                        />
                        {t("monthly")} <br />
                        <span className="font-semibold text-foreground">
                          {formatPrice(prices.monthly, userCurrency)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {t("/monthly")}
                        </span>
                      </Label>
                      {/* Annually */}
                      <Label
                        htmlFor="annually"
                        className={cn(
                          "cursor-pointer rounded-md border border-input p-3 text-center text-sm transition-colors hover:bg-muted/50 relative", // Added relative for badge positioning
                          billingFrequency === "annually" &&
                            "border-primary ring-1 ring-primary bg-primary/5"
                        )}
                      >
                        <RadioGroupItem
                          value="annually"
                          id="annually"
                          className="sr-only"
                        />
                        {t("annualy")} <br />
                        <span className="font-semibold text-foreground">
                          {formatPrice(prices.annually, userCurrency)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {t("/annualy")}
                        </span>
                        {/* Discount Badge */}
                        <Badge
                          variant="destructive"
                          className="absolute -top-2 -right-2 text-xs px-1.5 py-0.5"
                        >
                          {annualDiscountPercent}% OFF{" "}
                          {/* Removed Percent Icon */}
                        </Badge>
                      </Label>
                      {/* Biannually */}
                      <Label
                        htmlFor="biannually"
                        className={cn(
                          "cursor-pointer rounded-md border border-input p-3 text-center text-sm transition-colors hover:bg-muted/50 relative",
                          billingFrequency === "biannually" &&
                            "border-primary ring-1 ring-primary bg-primary/5"
                        )}
                      >
                        <RadioGroupItem
                          value="biannually"
                          id="biannually"
                          className="sr-only"
                        />
                        {t("twoYears")} <br />
                        <span className="font-semibold text-foreground">
                          {formatPrice(prices.biannually, userCurrency)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {t("/twoYears")}
                        </span>
                        {/* Discount Badge */}
                        <Badge
                          variant="destructive"
                          className="absolute -top-2 -right-2 text-xs px-1.5 py-0.5"
                        >
                          {biannualDiscountPercent}% OFF{" "}
                          {/* Removed Percent Icon */}
                        </Badge>
                      </Label>
                    </RadioGroup>
                    <p className="text-sm text-muted-foreground pt-2">
                      {t("completedAcess")}
                    </p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {premiumFeatures.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-4">
                    <Button
                      variant={
                        currentPlan === "Premium" ? "secondary" : "default"
                      }
                      className="w-full"
                      onClick={handleJoinPremium}
                      disabled={currentPlan === "Premium"}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      {currentPlan === "Premium"
                        ? t("currentPlan")
                        : t("signPremium")}
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Payment Methods Card */}
              <Card className="shadow-md rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5 text-primary" />{" "}
                    {t("paymentMethods")}
                  </CardTitle>
                  <Elements stripe={stripePromise}>
                    <AddPaymentMethodDialog
                      onPaymentMethodAdded={handlePaymentMethodAdded}
                      addPaymentMethodAction={addPaymentMethodFlow}
                    />
                  </Elements>
                </CardHeader>
                <CardContent className="space-y-3">
                  {savedCards.map((card) => (
                    <div
                      key={card.id}
                      className={cn(
                        "flex items-center justify-between p-3 border rounded-md hover:bg-muted/50",
                        // Add border if primary
                        card.isPrimary && "border-primary ring-1 ring-primary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                          <span className="font-medium">
                            {card.brand} **** {card.last4}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {`(${t("expires")} ${card.expYear})`}
                          </span>
                        </div>
                        {card.isPrimary && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            {t("primary")}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {!card.isPrimary && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => handleSetPrimaryCard(card.id)}
                          >
                            <Star className="mr-1 h-3 w-3" /> {t("setPrimary")}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteCard(card.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{t("deleteCard")}</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {savedCards.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("noPaymentMethodsSaved")}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Payment History Card - Updated */}
              <Card className="shadow-md rounded-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />{" "}
                    {t("paymentHistory")}
                  </CardTitle>
                  <CardDescription>
                    {t("billingHistory.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-x-auto">
                    {/* Adjust grid columns for new info */}
                    <div className="grid grid-cols-[1fr_1fr_0.8fr_1.5fr_0.5fr] p-2 text-xs font-medium text-muted-foreground border-b bg-muted/50 gap-2">
                      <div>{t("billingHistory.headers.date")}</div>
                      <div>{t("billingHistory.headers.amount")}</div>
                      <div>{t("billingHistory.headers.card")}</div>
                      <div className="flex items-center gap-1">
                        <FileBadge className="h-3 w-3" />{" "}
                        {t("billingHistory.headers.paymentId")}
                      </div>
                      <div>{t("billingHistory.headers.status")}</div>
                    </div>
                    {paymentHistory.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-[1fr_1fr_0.8fr_1.5fr_0.5fr] p-2 text-sm border-b last:border-b-0 items-center gap-2"
                      >
                        <div>{item.date.toLocaleDateString()}</div>
                        <div>{item.amount}</div>
                        <span className="text-xs">**** {item.cardLast4}</span>
                        <span
                          className="text-xs truncate"
                          title={item.paymentId}
                        >
                          {item.paymentId}
                        </span>
                        <Badge
                          variant={
                            item.status === "Active" || item.status === "Paid"
                              ? "default"
                              : "outline"
                          }
                          className="w-fit text-xs justify-self-start"
                        >
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                    {paymentHistory.length === 0 && (
                      <p className="text-sm text-muted-foreground p-4 text-center">
                        {t("billingHistory.empty")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Options Tab - Updated with Select components */}
          <TabsContent value="options">
            <Card className="shadow-md rounded-lg mt-4">
              <CardHeader>
                <CardTitle>{t("options.title")}</CardTitle>
                <CardDescription>{t("options.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {" "}
                {/* Increased spacing */}
                {/* Language Selection */}
                <div className="space-y-2">
                  <Label
                    htmlFor="language"
                    className="flex items-center gap-1.5"
                  >
                    <Languages className="h-4 w-4" />{" "}
                    {t("options.language.label")}
                  </Label>
                  <Select
                    value={selectedLanguage}
                    onValueChange={setSelectedLanguage}
                    disabled={isSaving}
                  >
                    <SelectTrigger
                      id="language"
                      className="w-full md:w-[250px]"
                    >
                      <SelectValue
                        placeholder={t("options.language.placeholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Add specific icons or flags if needed */}
                      <SelectItem value="en">English 🇺🇸</SelectItem>
                      <SelectItem value="pt">Português 🇧🇷</SelectItem>
                      <SelectItem value="es">Español 🇪🇸</SelectItem>
                      <SelectItem value="fr">Français 🇫🇷</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Currency Selection */}
                {/* <div className="space-y-2">
                <Label htmlFor="currency" className="flex items-center gap-1.5">
                  <Currency className="h-4 w-4" /> {t("options.currency.label")}
                </Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={setSelectedCurrency}
                  disabled={isSaving}
                >
                  <SelectTrigger id="currency" className="w-full md:w-[250px]">
                    <SelectValue
                      placeholder={t("options.currency.placeholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">
                      <span className="flex items-center gap-2">
                        R$ Real Brasileiro
                      </span>
                    </SelectItem>
                    <SelectItem value="USD">
                      <span className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> US Dollar
                      </span>
                    </SelectItem>
                    <SelectItem value="EUR">
                      <span className="flex items-center gap-2">
                        <Euro className="h-4 w-4" /> Euro
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSavePreferences} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSaving
                      ? t("options.saveButton.loading")
                      : t("options.saveButton.default")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="shadow-md rounded-lg mt-4">
              <CardHeader>
                <CardTitle>{t("notifications.title")}</CardTitle>
                <CardDescription>
                  {t("notifications.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="notif-invite" className="font-medium">
                        {t("notifications.items.invite.invite")}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t("notifications.items.invite.description")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="notif-invite"
                    checked={notificationPrefs.invite}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs((prev) => ({
                        ...prev,
                        invite: checked,
                      }))
                    }
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <FileEdit className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="notif-change" className="font-medium">
                        {t("notifications.items.change.title")}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t("notifications.items.change.description")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="notif-change"
                    checked={notificationPrefs.comment_update}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs((prev) => ({
                        ...prev,
                        comment_update: checked,
                      }))
                    }
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="notif-comment" className="font-medium">
                        {t("notifications.items.comment.title")}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t("notifications.items.comment.description")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="notif-comment"
                    checked={notificationPrefs.comment_reply}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs((prev) => ({
                        ...prev,
                        comment_reply: checked,
                      }))
                    }
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <CircleCheck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="notif-status" className="font-medium">
                        {t("notifications.items.status.title")}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t("notifications.items.status.description")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="notif-status"
                    checked={notificationPrefs.comment_status}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs((prev) => ({
                        ...prev,
                        comment_status: checked,
                      }))
                    }
                    disabled={isSaving}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="notif-marketing" className="font-medium">
                        {t("notifications.items.marketing.title")}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t("notifications.items.marketing.description")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="notif-marketing"
                    checked={notificationPrefs.marketing}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs((prev) => ({
                        ...prev,
                        marketing: checked,
                      }))
                    }
                    disabled={isSaving}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveNotifications} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSaving
                      ? t("notifications.saveButton.loading")
                      : t("notifications.saveButton.default")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card className="shadow-md rounded-lg mt-4">
              <CardHeader>
                <CardTitle>{t("appearance.title")}</CardTitle>
                <CardDescription>{t("appearance.description")}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Label>{t("appearance.theme")}</Label>
                <ThemeToggle />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
