"use client"; // Make this a client component

import * as React from "react"; // Import React and hooks
import { useRouter } from "next/navigation"; // Import useRouter for redirection
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator"; // Import Separator
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select components
import {
  Link as LinkIcon,
  PlusCircle,
  Save,
  LogOut,
  Trash2,
  Loader2,
  X,
  Briefcase,
  GraduationCap,
  Heart,
  Twitter,
  Github,
  Linkedin,
  Globe,
  Mail,
} from "lucide-react"; // Added social icons and category icons
import type { LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // Import toast
import { cn } from "@/lib/utils";
import { handleLogout } from "@/lib/auth";
import { logoutAction } from "@/actions/auth-actions";
import { useAuth } from "@/hooks/use-auth";
import { uploadAvatarFile, updateUserProfile } from "@/services/profile";
import { useTranslations } from "next-intl";

// Mock data for profile (will be used for initial state)
const initialUserProfile = {
  name: "Hestorg User",
  email: "user@projectude.com",
  avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704d", // Assuming email comes from auth (non-editable)
  bio: "Passionate project manager exploring Projectude features.",
  socialLinks: [
    {
      id: "sl1",
      iconKey: "linkedin",
      url: "https://linkedin.com/in/projectudeuser",
    }, // Changed platform to iconKey
    { id: "sl2", iconKey: "github", url: "https://github.com/projectudeuser" }, // Changed platform to iconKey
  ],
  tags: {
    hobbies: ["Reading", "Hiking", "Photography"],
    skills: ["Project Management", "React", "TailwindCSS", "Next.js"],
    education: ["B.Sc. Computer Science"],
  },
};

// Define available social icons
const socialIcons: Record<string, { icon: LucideIcon; label: string }> = {
  linkedin: { icon: Linkedin, label: "LinkedIn" },
  github: { icon: Github, label: "GitHub" },
  twitter: { icon: Twitter, label: "Twitter" },
  website: { icon: Globe, label: "Website" },
  email: { icon: Mail, label: "Email" },
  other: { icon: LinkIcon, label: "Other Link" },
};
type SocialIconKey = keyof typeof socialIcons;

// Define types for state
type SocialLink = { id: string; iconKey: SocialIconKey; url: string }; // Updated type
type Tags = {
  hobbies?: string[];
  skills?: string[];
  education?: string[];
};
type UserProfileState = Omit<
  typeof initialUserProfile,
  "tags" | "socialLinks"
> & {
  tags: Tags;
  socialLinks: SocialLink[];
};

// Helper to get social icon based on key
const getSocialIcon = (iconKey?: SocialIconKey): React.ReactElement => {
  const iconData = iconKey ? socialIcons[iconKey] : socialIcons.other;
  const IconComponent = iconData ? iconData.icon : LinkIcon;
  return <IconComponent className="h-4 w-4 text-muted-foreground" />;
};

// Helper to get category icon
const getCategoryIcon = (category: keyof Tags) => {
  switch (category) {
    case "hobbies":
      return <Heart className="h-3 w-3" />;
    case "skills":
      return <Briefcase className="h-3 w-3" />;
    case "education":
      return <GraduationCap className="h-3 w-3" />;
    default:
      return null;
  }
};

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter(); // Initialize router
  const { userData } = useAuth();
  const t = useTranslations("profile");

  // estados controlados (vazios até profile carregar)
  const [form, setForm] = React.useState<any>({
    displayName: "",
    username: "",
    address: { country: "", state: "", city: "", neighborhood: "", street: "" },
    socialLinks: [] as any[],
    bio: "",
    tags: {} as Record<string, string[]>,
  });
  const [avatarFile, setSelectedAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Updated newLink state to use iconKey
  const [newLink, setNewLink] = React.useState<{
    iconKey: SocialIconKey | "";
    url: string;
  }>({ iconKey: "", url: "" });
  const [newTags, setNewTags] = React.useState<{ [key in keyof Tags]: string }>(
    { hobbies: "", skills: "", education: "" }
  );

  // Quando carregar profile do Firestore, inicializa o form
  React.useEffect(() => {
    if (!userData) return;
    setForm({
      displayName: userData.displayName || "",
      username: userData.username || "",
      bio: userData.bio || "",
      address: userData.address || form.address,
      socialLinks: userData.socialLinks || [],
      tags: userData.tags || {},
    });
    setAvatarPreview(userData.photoURL || null);
  }, [userData]);

  // --- Handlers ---

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = (category: keyof Tags) => {
    const tagValue = newTags[category]?.trim();
    if (tagValue && !form.tags[category]?.includes(tagValue)) {
      setForm((prev: any) => ({
        ...prev,
        tags: {
          ...prev.tags,
          [category]: [...(prev.tags[category] || []), tagValue],
        },
      }));
      setNewTags((prev) => ({ ...prev, [category]: "" }));
    }
  };

  const handleRemoveTag = (category: keyof Tags, tagToRemove: string) => {
    setForm((prev: any) => ({
      ...prev,
      tags: {
        ...prev.tags,
        [category]: prev.tags[category]?.filter((t: any) => t !== tagToRemove),
      },
    }));
  };

  const handleAddLink = () => {
    if (newLink.iconKey && newLink.url.trim()) {
      try {
        new URL(newLink.url);
        setForm((prev: any) => ({
          ...prev,
          socialLinks: [
            ...prev.socialLinks,
            {
              iconKey: newLink.iconKey,
              url: newLink.url,
              id: `sl-${Date.now()}`,
            },
          ],
        }));
        setNewLink({ iconKey: "", url: "" });
      } catch {
        toast({
          variant: "destructive",
          title: t("socialLinks.invalidUrlTitle"),
          description: t("socialLinks.invalidUrlDescription"),
        });
      }
    }
  };

  const handleRemoveLink = (idToRemove: string) => {
    setForm((prev: any) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((l: any) => l.id !== idToRemove),
    }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = "";
  };

  const handleSave = async () => {
    if (!userData?.uid) return;
    setIsSaving(true);
    try {
      let photoURL: string | undefined;
      if (avatarFile) {
        photoURL = await uploadAvatarFile(userData?.uid, avatarFile);
      }
      await updateUserProfile(userData?.uid, form, photoURL);
      toast({
        title: t("saveButton.successTitle"),
        description: t("saveButton.successDescription"),
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: t("saveButton.errorTitle"),
        description: t("saveButton.errorDescription"),
      });
    } finally {
      setIsSaving(false);
    }
  };
  const signOut = async () => {
    try {
      await handleLogout();
      await logoutAction();
      router.push("/login");
    } catch (error) {
      toast({
        title: t("logout.errorTitle"),
        description: t("logout.errorDescription"),
      });
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t("pageTitle")}</h1>
        <Button
          variant="outline"
          onClick={signOut}
          className="w-full sm:w-auto"
        >
          <LogOut className="mr-2 h-4 w-4" /> {t("logout.button")}
        </Button>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-3 gap-8">
        {/* --- Left Column Content --- */}
        <div className="md:col-span-1 space-y-6 order-1 md:order-none">
          {/* Avatar Card */}
          <Card className="shadow-md rounded-lg">
            <CardContent className="pt-6 flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32 border-4 border-primary">
                <AvatarImage
                  src={avatarPreview || undefined}
                  alt={userData?.displayName}
                />
                <AvatarFallback className="text-4xl">
                  {userData?.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                id="avatarUpload"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("avatarUpload")?.click()}
                disabled={isSaving}
              >
                {t("avatar.uploadButton")}
              </Button>
              <div className="text-center">
                <h2 className="text-xl font-semibold">
                  {userData?.displayName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {userData?.email}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* About Me Card - Order 2 on mobile */}
          <Card className="shadow-md rounded-lg order-2 md:order-none">
            <CardHeader>
              <CardTitle className="text-lg">{t("aboutMe.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="displayName">{t("aboutMe.nameLabel")}</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  value={form.displayName}
                  onChange={handleInputChange}
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="bio">{t("aboutMe.bioLabel")}</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleInputChange}
                  rows={4}
                  disabled={isSaving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Links Card - Order 3 on mobile */}
          <Card className="shadow-md rounded-lg order-3 md:order-none">
            <CardHeader>
              <CardTitle className="text-lg">
                {t("socialLinks.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.socialLinks?.map((link: any) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-2 group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getSocialIcon(link.iconKey)}{" "}
                    {/* Use helper with iconKey */}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline truncate"
                      title={link.url}
                    >
                      {link.url.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveLink(link.id)}
                    disabled={isSaving}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">
                      {t("socialLinks.removeButton")}
                    </span>
                  </Button>
                </div>
              ))}
              {form.socialLinks?.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  {t("socialLinks.empty")}
                </p>
              )}
              <Separator />
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* Replaced Platform Input with Icon Select */}
                  <Select
                    value={newLink.iconKey}
                    onValueChange={(value) =>
                      setNewLink((prev) => ({
                        ...prev,
                        iconKey: value as SocialIconKey,
                      }))
                    }
                    disabled={isSaving}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={t("socialLinks.selectPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(socialIcons) as SocialIconKey[]).map(
                        (key) => {
                          const IconComponent = socialIcons[key].icon;
                          return (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                {socialIcons[key].label}
                              </span>
                            </SelectItem>
                          );
                        }
                      )}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={`${t(
                      "socialLinks.urlPlaceholder"
                    )} (https://...)`}
                    value={newLink.url}
                    onChange={(e) =>
                      setNewLink((prev) => ({ ...prev, url: e.target.value }))
                    }
                    disabled={isSaving}
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={handleAddLink}
                  disabled={isSaving || !newLink.iconKey || !newLink.url}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />{" "}
                  {t("socialLinks.addButton")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- Right Column Content --- */}
        <div className="md:col-span-2 space-y-6 order-4 md:order-none">
          {" "}
          {/* Order 4 on mobile */}
          {/* Tags Card */}
          <Card className="shadow-md rounded-lg">
            <CardHeader>
              <CardTitle className="text-lg">{t("tags.title")}</CardTitle>
              <CardDescription>{t("tags.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(Object.keys(form.tags) as Array<keyof Tags>).map((category) => (
                <div key={category}>
                  <Label className="capitalize font-medium flex items-center gap-1.5">
                    {" "}
                    {getCategoryIcon(category)} {category}
                  </Label>
                  <div className="flex flex-wrap gap-1.5 mt-2 border p-3 rounded-md min-h-[40px] bg-muted/50">
                    {(form.tags[category] || []).map((tag: any) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-default group relative pr-5"
                      >
                        {tag}
                        <button
                          className="absolute top-1/2 right-1 transform -translate-y-1/2 ml-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                          onClick={() => handleRemoveTag(category, tag)}
                          disabled={isSaving}
                          aria-label={`${t("tags.removeAriaLabel")} ${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {(form.tags[category] === undefined ||
                      form.tags[category]!.length === 0) && (
                      <p className="text-xs text-muted-foreground">
                        {t("tags.emptyCategory")} {category}{" "}
                        {t("tags.addedYet")}.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder={`${t("tags.inputPlaceholder")} ${category}`}
                      value={newTags[category]}
                      onChange={(e) =>
                        setNewTags((prev) => ({
                          ...prev,
                          [category]: e.target.value,
                        }))
                      }
                      disabled={isSaving}
                      className="h-8 text-sm flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag(category);
                        }
                      }} // Add on Enter
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => handleAddTag(category)}
                      disabled={isSaving || !newTags[category]?.trim()}
                    >
                      <PlusCircle className="mr-1 h-3 w-3" />{" "}
                      {t("tags.addButton")}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          {/* Save button - Order 5 on mobile */}
          <div className="flex justify-end order-5 md:order-none">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving ? t("saveButton.saving") : t("saveButton.default")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
