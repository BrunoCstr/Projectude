"use client";

import * as React from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label"; // Import Label
import {
  Link as LinkIcon,
  Briefcase,
  GraduationCap,
  Heart,
  Mail,
  Phone,
  MapPin,
  Twitter,
  Github,
  Linkedin,
  Globe,
} from "lucide-react"; // Added more icons
import type { LucideIcon } from "lucide-react";
import type {
  Collaborator,
  CollaboratorProfile,
} from "@/services/collaborator"; // Assuming CollaboratorProfile exists or update Collaborator
import { Loader2 } from "lucide-react";

interface CollaboratorProfileDialogProps {
  collaborator: Collaborator; // Base info for trigger
  profile: CollaboratorProfile; // Full profile data
  children: React.ReactNode; // The trigger button
}

// Define available social icons (consistent with profile page)
const socialIcons: Record<string, { icon: LucideIcon; label: string }> = {
  linkedin: { icon: Linkedin, label: "LinkedIn" },
  github: { icon: Github, label: "GitHub" },
  twitter: { icon: Twitter, label: "Twitter" },
  website: { icon: Globe, label: "Website" },
  email: { icon: Mail, label: "Email" },
  other: { icon: LinkIcon, label: "Other Link" },
};
type SocialIconKey = keyof typeof socialIcons;

// Helper to get social icon based on key
const getSocialIcon = (iconKey?: string): React.ReactElement => {
  // Accept string key
  const key = iconKey as SocialIconKey; // Cast to known key type
  const iconData =
    key && socialIcons[key] ? socialIcons[key] : socialIcons.other;
  const IconComponent = iconData ? iconData.icon : LinkIcon;
  return <IconComponent className="h-4 w-4 text-muted-foreground" />;
};

export function CollaboratorProfileDialog({
  collaborator,
  profile,
  children,
}: CollaboratorProfileDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {profile ? (
          (() => {
            const avatarSrc =
              profile.photoURL;
            const displayName = profile.name ?? "Colaborador";

            return (
              <>
                <div className="bg-muted/50 p-6 flex items-center gap-6 border-b">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                    <AvatarImage src={avatarSrc} alt={displayName} />
                    <AvatarFallback className="text-3xl">
                      {displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <DialogTitle className="text-2xl font-bold">
                      {displayName}
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground">
                      {profile.email ?? "Sem e-mail cadastrado"}
                    </DialogDescription>
                    {/* <p className="text-sm text-muted-foreground">{profile.jobTitle || 'Collaborator'}</p> */}
                  </div>
                </div>

                {/* Profile Body */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column (Contact & Links) */}
                  <div className="md:col-span-1 space-y-6">
                    {/* Bio Card */}
                    {profile.bio && (
                      <Card className="shadow-none border-0 bg-transparent">
                        <CardHeader className="p-0 pb-2">
                          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            About
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <p className="text-sm text-foreground/90">
                            {profile.bio}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Social Links Card */}
                    {profile.socialLinks && profile.socialLinks.length > 0 && (
                      <Card className="shadow-none border-0 bg-transparent">
                        <CardHeader className="p-0 pb-2">
                          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Links
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 space-y-2">
                          {/* Updated to use iconKey if available, fallback to platform */}
                          {profile.socialLinks.map((link) => (
                            <div
                              key={link.id}
                              className="flex items-center gap-2"
                            >
                              {getSocialIcon(link.iconKey ?? undefined)}{" "}
                              {/* Use iconKey or platform */}
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline truncate"
                                title={link.url}
                              >
                                {link.url
                                  .replace(/^https?:\/\//, "")
                                  .replace(/\/$/, "")}{" "}
                                {/* Remove protocol and trailing slash */}
                              </a>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Right Column (Tags) */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Tags Section */}
                    {profile.tags && Object.keys(profile.tags).length > 0 && (
                      <Card className="shadow-none border-0 bg-transparent">
                        <CardHeader className="p-0 pb-3">
                          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 space-y-4">
                          {profile.tags.hobbies &&
                            profile.tags.hobbies.length > 0 && (
                              <div>
                                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                                  <Heart className="h-3 w-3" /> Hobbies
                                </Label>
                                <div className="flex flex-wrap gap-1.5">
                                  {profile.tags.hobbies.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="secondary"
                                      className="font-normal"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          {profile.tags.skills &&
                            profile.tags.skills.length > 0 && (
                              <div>
                                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                                  <Briefcase className="h-3 w-3" /> Skills &
                                  Experience
                                </Label>
                                <div className="flex flex-wrap gap-1.5">
                                  {profile.tags.skills.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="secondary"
                                      className="font-normal"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          {profile.tags.education &&
                            profile.tags.education.length > 0 && (
                              <div>
                                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                                  <GraduationCap className="h-3 w-3" />{" "}
                                  Education
                                </Label>
                                <div className="flex flex-wrap gap-1.5">
                                  {profile.tags.education.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="secondary"
                                      className="font-normal"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                <DialogFooter className="p-6 border-t bg-muted/50 sm:justify-end">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Close
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </>
            );
          })()
        ) : (
          <div className="flex min-h-full flex-col items-center justify-center bg-muted/30 dark:bg-background p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
