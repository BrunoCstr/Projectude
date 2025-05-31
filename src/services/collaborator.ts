"use client";

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  writeBatch,
  doc,
  getDoc,
} from "firebase/firestore";
import { getInitializedAuth } from "@/lib/firebase";
import { getInitializedFirestore } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";

const auth = getInitializedAuth();
const db = getInitializedFirestore();

/**
 * Represents a base collaborator.
 */
export interface Collaborator {
  /**
   * The unique identifier of the collaborator.
   */
  id: string;
  /**
   * The name of the collaborator.
   */
  name: string;
  /**
   * The email of the collaborator.
   */
  email: string;
  /**
   * The URL of the collaborator's avatar image. Optional.
   */
  photoURL?: string;
}

/**
 * Represents the public profile information of a collaborator.
 * This extends the base Collaborator interface with profile-specific details.
 */
export interface CollaboratorProfile extends Collaborator {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  bio?: string;
  socialLinks?: { id: string; iconKey: string; url: string }[]; // Changed platform to iconKey
  tags?: {
    hobbies?: string[];
    skills?: string[];
    education?: string[];
  };
  // Add other public fields as needed (e.g., jobTitle, location)
}

/**
 * Represents a received invitation to collaborate.
 */
export interface Invitation {
  id: string;
  inviterId: string; // ID of the person who invited
  inviterName: string;
  inviterEmail: string; // Optional: Could be useful
  inviterphotoURL?: string; // Optional: Inviter's avatar
  status: "pending" | "accepted" | "declined"; // Status of the invitation
  createdAt: string; // ISO date string
}

// Mock collaborators including photoURL - Exported
export let mockCollaborators: Collaborator[] = [
  {
    id: "collab1",
    name: "Dev User",
    email: "dev@example.com",
    photoURL: "https://i.pravatar.cc/40?u=dev",
  },
  {
    id: "collab2",
    name: "Manager User",
    email: "manager@example.com",
    photoURL: "https://i.pravatar.cc/40?u=manager",
  },
  {
    id: "3", // Existing mock user
    name: "John Doe",
    email: "john.doe@example.com",
    photoURL: "https://i.pravatar.cc/40?u=a042581f4e29026704e",
  },
  {
    id: "4", // Existing mock user
    name: "Jane Smith",
    email: "jane.smith@example.com",
    photoURL: "https://i.pravatar.cc/40?u=a042581f4e29026704f",
  },
  {
    id: "extra1",
    name: "Extra Collab 1",
    email: "extra1@example.com",
    photoURL: "https://i.pravatar.cc/40?u=extra1",
  },
  {
    id: "extra2",
    name: "Extra Collab 2",
    email: "extra2@example.com",
    photoURL: "https://i.pravatar.cc/40?u=extra2",
  },
  // Add more if needed for testing larger numbers
];

// Mock full profile data (merge with collaborators or store separately) - Exported
export const mockProfiles: Record<string, CollaboratorProfile> = {
  collab1: {
    id: "collab1",
    name: "Dev User",
    email: "dev@example.com",
    photoURL: "https://i.pravatar.cc/150?u=dev", // Larger avatar for profile view
    bio: "Full-stack developer passionate about React and Next.js.",
    socialLinks: [
      { id: "dev-gh", iconKey: "github", url: "https://github.com/devuser" }, // Changed platform to iconKey
      {
        id: "dev-li",
        iconKey: "linkedin",
        url: "https://linkedin.com/in/devuser",
      }, // Changed platform to iconKey
    ],
    tags: {
      skills: ["React", "TypeScript", "Next.js", "Node.js", "Firebase"],
      hobbies: ["Coding", "Gaming", "Reading Sci-Fi"],
      education: ["B.Sc. Software Engineering"],
    },
  },
  collab2: {
    id: "collab2",
    name: "Manager User",
    email: "manager@example.com",
    photoURL: "https://i.pravatar.cc/150?u=manager",
    bio: "Experienced project manager focused on delivering results.",
    socialLinks: [
      {
        id: "man-li",
        iconKey: "linkedin",
        url: "https://linkedin.com/in/manageruser",
      }, // Changed platform to iconKey
    ],
    tags: {
      skills: ["Project Management", "Agile Methodologies", "Team Leadership"],
      hobbies: ["Hiking", "Photography"],
      education: ["MBA"],
    },
  },
  "3": {
    id: "3",
    name: "John Doe",
    email: "john.doe@example.com",
    photoURL: "https://i.pravatar.cc/150?u=a042581f4e29026704e",
    bio: "Frontend enthusiast exploring new technologies.",
    socialLinks: [
      { id: "john-tw", iconKey: "twitter", url: "https://twitter.com/johndoe" }, // Changed platform to iconKey
      { id: "john-ws", iconKey: "website", url: "https://johndoe.dev" }, // Changed platform to iconKey
    ],
    tags: {
      skills: ["HTML", "CSS", "JavaScript", "Vue.js"],
      hobbies: ["Cycling", "Cooking"],
      // education: undefined // Example of missing tag category
    },
  },
  "4": {
    id: "4",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    photoURL: "https://i.pravatar.cc/150?u=a042581f4e29026704f",
    bio: "Data analyst passionate about visualizing data.",
    // socialLinks: [], // Example of no social links
    tags: {
      skills: ["Python", "SQL", "Data Visualization", "Statistics"],
      hobbies: ["Yoga", "Traveling"],
      education: ["M.Sc. Data Science"],
    },
  },
  extra1: {
    // Add profile for extra1
    id: "extra1",
    name: "Extra Collab 1",
    email: "extra1@example.com",
    photoURL: "https://i.pravatar.cc/150?u=extra1",
    bio: "UI Designer",
    tags: { skills: ["Figma", "Illustrator"] },
  },
  extra2: {
    // Add profile for extra2
    id: "extra2",
    name: "Extra Collab 2",
    email: "extra2@example.com",
    photoURL: "https://i.pravatar.cc/150?u=extra2",
    bio: "QA Tester",
    tags: { skills: ["Testing", "Automation"] },
  },
};

/**
 * Asynchronously retrieves a list of collaborators.
 *
 * @returns A promise that resolves to an array of Collaborator objects.
 */
export async function listCollaborators(userId: string): Promise<Collaborator[]> {
  const me = auth.currentUser;
  if (!me || !me.uid) {
    // Se não houver usuário logado, não tenta o where(undefined)
    return [];
  }

  const collabSnap = await getDocs(
    collection(db, "users", me.uid, "collaborators")
  );
  const collabIds = collabSnap.docs.map((d) => d.id);

  // 2) Para cada ID, buscar o document em users/{collabId}
  const profiles = await Promise.all(
    collabIds.map(async (collabId) => {
      const userRef = doc(db, "users", collabId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return null;
      }
      const data = userSnap.data() as {
        name?: string;
        displayName?: string;
        email?: string;
        photoURL?: string;
      };
      return {
        id: userSnap.id,
        name: data.name ?? data.displayName ?? "Sem nome",
        email: data.email ?? "",
        photoURL: data.photoURL ?? "",
      } as Collaborator;
    })
  );

  // 3) Filtrar nulos (caso algum usuário não exista) e retornar
  return profiles.filter((p): p is Collaborator => p !== null);
}

/**
 * Sends an invitation to a collaborator via email.
 * (Currently a mock function)
 *
 * @param email The email address of the collaborator to invite.
 * @returns A promise that resolves when the invitation is sent (or simulated).
 */
export async function inviteCollaborator(email: string): Promise<void> {
  const me = auth.currentUser;
  if (!me) throw new Error("Usuário não autenticado.");

  const cleanEmail = email.trim().toLowerCase();

  // 1) Encontre o UID do usuário destino pelo e-mail
  const usersRef = collection(db, "users");
  const userQ = query(usersRef, where("email", "==", cleanEmail));
  const userSnap = await getDocs(userQ);
  if (userSnap.empty) {
    toast({
      title: "Usuário não existe!",
      description: `Não existe usuário cadastrado com esse e-mail ${email}.`,
    });
    throw new Error("Não existe usuário cadastrado com esse e-mail.");
  }
  const inviteeUid = userSnap.docs[0].id;

  // 2) Crie o convite na subcoleção do usuário convidado
  const invitesRef = collection(db, "users", inviteeUid, "invitations");
  await addDoc(invitesRef, {
    inviterId: me.uid,
    inviterName: me.displayName,
    inviterEmail: me.email,
    inviterAvatarUrl: me.photoURL || null,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  // 3) Envie o e-mail de convite
  // await sendEmail(cleanEmail);

  toast({
    title: "Convite enviado!",
    description: `Convite para ${cleanEmail} foi enviado com sucesso.`,
  });
}

/**
 * Deletes a collaborator by their ID.
 * (Currently a mock function that modifies the in-memory array)
 *
 * @param collaboratorId The ID of the collaborator to delete.
 * @returns A promise that resolves when the collaborator is deleted (or simulated).
 * @throws An error if the collaborator is not found or if deletion fails.
 */
export async function deleteCollaborator(
  collaboratorId: string
): Promise<void> {
  const me = auth.currentUser;
  if (!me) throw new Error("Usuário não autenticado.");

  const batch = writeBatch(db);

  // 1) Deleta o colaborador da subcoleção do usuário
  const collabRef = doc(db, "users", me.uid, "collaborators", collaboratorId);
  batch.delete(collabRef);

  // 2) Procura todos os projetos onde esse ID aparece em collaboratorIds
  const projectsRef = collection(db, "projects");
  const q = query(
    projectsRef,
    where("collaboratorIds", "array-contains", collaboratorId)
  );
  const snap = await getDocs(q);

  // 3) Para cada projeto, recalcula os arrays sem esse colaborador
  snap.docs.forEach((projDoc) => {
    const data = projDoc.data() as {
      collaboratorIds?: string[];
      collaborators?: { id: string; canViewCredentials: boolean }[];
    };

    const updatedIds = (data.collaboratorIds || []).filter(
      (id) => id !== collaboratorId
    );
    const updatedCollabs = (data.collaborators || []).filter(
      (c) => c.id !== collaboratorId
    );

    batch.update(projDoc.ref, {
      collaboratorIds: updatedIds,
      collaborators: updatedCollabs,
    });
  });

  // 4) Executa tudo em batch
  await batch.commit();
}

/**
 * Asynchronously retrieves the public profile of a collaborator.
 * (Currently a mock function)
 *
 * @param collaboratorId The ID of the collaborator whose profile is to be fetched.
 * @returns A promise that resolves to a CollaboratorProfile object.
 * @throws An error if the profile is not found.
 */
export async function getCollaboratorProfile(
  collaboratorId: string
): Promise<CollaboratorProfile> {
  const ref = doc(db, "users", collaboratorId);
  const snap = await getDoc(ref);

  // 2) Verifica existência
  if (!snap.exists()) {
    throw new Error(`Perfil do colaborador ${collaboratorId} não encontrado.`);
  }

  const data = snap.data() as {
    name: string;
    email: string;
    photoURL?: string;
    bio?: string;
    socialLinks?: { id: string; iconKey: string; url: string }[];
    tags?: Record<string, string>;
  };

  const socialLinks = data.socialLinks || [];
  const tags = data.tags || {};

  // 3) Extrai dados
  return {
    id: collaboratorId,
    name: data.name,
    email: data.email,
    photoURL: data.photoURL,
    bio: data.bio,
    socialLinks,
    tags,
  };
}
