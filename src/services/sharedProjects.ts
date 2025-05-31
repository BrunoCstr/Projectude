import {
  collection,
  getDocs,
  query,
  where,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { getInitializedFirestore } from "@/lib/firebase";
import type { Project } from "@/services/project";

const db = getInitializedFirestore();

export async function listSharedProjects(userId: string): Promise<Project[]> {
  try {
    const q = query(
      collection(db, "projects"),
      where("collaboratorIds", "array-contains", userId)
    );
    const snap = await getDocs(q);

    const shared = snap.docs
      .map((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...(data as Omit<Project, "id">),
        } as Project;
      })
      .filter((proj) => proj.creatorUID !== userId);

    return shared;
  } catch (error) {
    console.error("Erro ao listar projetos compartilhados:", error);
    throw error;
  }
}
