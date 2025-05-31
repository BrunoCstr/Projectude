import type { Collaborator } from "./collaborator";
import { getInitializedFirestore } from "@/lib/firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  or,
} from "firebase/firestore";

const db = getInitializedFirestore();

// ================== TIPAGENS ==================

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface ProjectLink {
  id: string;
  type: string;
  url: string;
}

export interface Credential {
  id: string;
  email?: string;
  password?: string;
  description: string;
  url?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  neighborhood?: string;
  zipCode?: string;
}

export interface ProjectCollaborator extends Collaborator {
  canViewCredentials?: boolean;
}

export interface ProjectAttachment {
  id: string;
  name: string;
  url?: string;
  type?: string;
  size?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  creatorName: string;
  creatorUID: string;
  createdAt: string;
  logoUrl?: string;
  coverUrl?: string;
  tags?: Tag[];
  startDate?: string;
  investment?: number;
  isPhysical?: boolean;
  address?: Address;
  links?: ProjectLink[];
  credentials?: Credential[];
  collaborators?: ProjectCollaborator[];
  collaboratorsId?: string[];
  attachments?: ProjectAttachment[];
}

// ================== BUSCAS REAIS ==================

/**
 * Busca todos os projetos do Firestore (coleção "projects")
 */
export async function listProjects(userId: string): Promise<Project[]> {
  const q = query(
    collection(db, "projects"),
    where("creatorUID", "==", userId)
  );

  const snapshot = await getDocs(q);
  const projects: Project[] = [];
  console.log(snapshot);

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    projects.push({
      id: docSnap.id,
      ...data,
    } as Project);
  });

  return projects;
}

/**
 * Busca um projeto específico por ID
 */
export async function getProject(projectId: string): Promise<Project> {
  const ref = doc(db, "projects", projectId);
  const docSnap = await getDoc(ref);

  if (!docSnap.exists()) {
    throw new Error("Projeto não encontrado");
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
  } as Project;
}

export async function listCollaboratorProjects(
  userId: string
): Promise<Project[]> {
  const q = query(
    collection(db, "projects"),
    where("collaboratorIds", "array-contains", userId)
  );

  const snapshot = await getDocs(q);
  const projects: Project[] = [];
  console.log(snapshot);

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    projects.push({
      id: docSnap.id,
      ...data,
    } as Project);
  });

  return projects;
}

export async function listCollaboratorProjectsAndOwnerProjects(
  userId: string
): Promise<Project[]> {
  const q = query(
    collection(db, "projects"),
    or(
      where("creatorUID", "==", userId),
      where("collaboratorIds", "array-contains", userId)
    )
  );
  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => {
    const data = docSnap.data() as Omit<Project, "id">;
    return {
      id: docSnap.id,
      ...data,
    };
  });
}
