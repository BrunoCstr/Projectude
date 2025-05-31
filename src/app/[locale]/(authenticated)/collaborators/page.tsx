"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  listCollaborators,
  getCollaboratorProfile,
} from "@/services/collaborator";
import type {
  Collaborator,
  CollaboratorProfile,
  Invitation,
} from "@/services/collaborator";
import { UserPlus, Eye } from "lucide-react";
import { InviteCollaboratorDialog } from "@/components/collaborators/invite-collaborator-dialog";
import { DeleteConfirmationDialog } from "@/components/collaborators/delete-confirmation-dialog";
import { CollaboratorProfileDialog } from "@/components/collaborators/collaborator-profile-dialog";
import { deleteCollaboratorAction } from "@/actions/collaborator-actions";
import { AcceptInvitationButton } from "@/components/collaborators/accept-invitation-button";
import { DeclineInvitationButton } from "@/components/collaborators/decline-invitation-button";
import { listInvitations } from "@/services/invitation";
import { getInitializedAuth } from "@/lib/firebase";
import { useTranslations } from "next-intl";

const auth = getInitializedAuth();

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, CollaboratorProfile>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  const t = useTranslations("collaborators");

  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  useEffect(() => {
    async function loadAll() {
      try {
        const [collabs, received] = await Promise.all([
          listCollaborators(user!.uid),
          listInvitations(),
        ]);
        setCollaborators(collabs);
        setInvites(received);

        const profs: Record<string, CollaboratorProfile> = {};
        await Promise.all(
          collabs.map(async (c) => {
            try {
              profs[c.id] = await getCollaboratorProfile(c.id);
            } catch {
              profs[c.id] = {
                id: c.id,
                name: c.name,
                email: c.email,
                photoURL: c.photoURL,
                bio: "Profile not available.",
                socialLinks: [],
                tags: {},
              };
            }
          })
        );
        setProfiles(profs);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  // Helper function to safely get initials from a name
  const getInitial = (name: any) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("collaboratorsPage.title")}
        </h1>
        <InviteCollaboratorDialog>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />{" "}
            {t("collaboratorsPage.inviteButton")}
          </Button>
        </InviteCollaboratorDialog>
      </div>

      {/* Collaborators Grid */}
      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>{t("collaboratorsPage.myCollaborators.title")}</CardTitle>
          <CardDescription>
            {t("collaboratorsPage.myCollaborators.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {collaborators.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {t("collaboratorsPage.noCollaborators")}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {collaborators.map((collab) => {
                const profile = profiles[collab.id]; // Get pre-fetched profile or default
                return (
                  // Updated Card structure for better responsiveness
                  <Card
                    key={collab.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Avatar + Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {" "}
                      {/* Added flex-1 and min-w-0 */}
                      <Avatar className="flex-shrink-0">
                        {" "}
                        {/* Prevent avatar shrinking */}
                        <AvatarImage
                          src={
                            collab.photoURL ?? `/default_profile_picture.png`
                          }
                          alt={collab.name || "Collaborator"}
                        />
                        <AvatarFallback>
                          {getInitial(collab.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        {" "}
                        {/* Allow text truncation */}
                        <p className="font-medium truncate">
                          {collab.name || t("collaboratorsPage.unknown")}
                        </p>{" "}
                        {/* Add truncate */}
                        <p className="text-xs text-muted-foreground truncate">
                          {collab.email || t("collaboratorsPage.noEmail")}
                        </p>{" "}
                        {/* Add truncate */}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1 flex-shrink-0 self-end sm:self-center">
                      {" "}
                      {/* Added flex-shrink-0 and adjusted alignment */}
                      <CollaboratorProfileDialog
                        collaborator={collab}
                        profile={profile}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">
                            {t("collaboratorsPage.viewProfile")}
                          </span>
                        </Button>
                      </CollaboratorProfileDialog>
                      <DeleteConfirmationDialog
                        collaboratorId={collab.id}
                        collaboratorName={collab.name || "this collaborator"}
                        deleteAction={deleteCollaboratorAction}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Received Invitations List */}
      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>{t("receivedInvitations.title")}</CardTitle>
          <CardDescription>
            {t("receivedInvitations.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {t("receivedInvitations.noInvitations")}
            </p>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors gap-3"
                >
                  {/* Inviter Info + Avatar */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage
                        src={
                          invite.inviterphotoURL ??
                          `/default_profile_picture.png`
                        }
                        alt={invite.inviterName || "Inviter"}
                      />
                      <AvatarFallback>
                        {getInitial(invite.inviterName)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm flex-1">
                      <span className="font-medium">
                        {invite.inviterName || "Someone"}
                      </span>{" "}
                      {t("receivedInvitations.invited")}
                    </p>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
                    <AcceptInvitationButton
                      invitationId={invite.id}
                      inviterName={invite.inviterName || "this person"}
                    />
                    <DeclineInvitationButton
                      invitationId={invite.id}
                      inviterName={invite.inviterName || "this person"}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
