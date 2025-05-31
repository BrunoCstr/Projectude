import type { Tag } from './project'; // Reuse Tag interface from project service
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  FirestoreError,
  Timestamp,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { getInitializedFirestore } from '@/lib/firebase';

export let defaultTags: Tag[] = [
  { id: 't-urg', name: 'Urgent', description: 'Requires immediate attention', color: 'hsl(0 84.2% 60.2%)' }, // Destructive red
  { id: 't-feat', name: 'Feature Request', description: 'New feature suggestion', color: 'hsl(180 82% 44%)' }, // Primary color
  { id: 't-bug', name: 'Bug', description: 'Something is broken', color: 'hsl(16 100% 66%)' }, // Accent color (Coral)
  { id: 't-des', name: 'Design', description: 'Related to UI/UX', color: 'hsl(240 5.9% 10%)' }, // Dark Gray
  { id: 't-dev', name: 'Development', description: 'Related to code implementation', color: 'hsl(210 40% 96.1%)' }, // Light Blue/Gray
  { id: 't-mark', name: 'Marketing', description: 'Promotion and outreach', color: 'hsl(36 92% 50%)' }, // Orange/Yellow
];

const db = getInitializedFirestore();

/**
 * Asynchronously retrieves a list of tags.
 *
 * @returns A promise that resolves to an array of Tag objects.
 */
export async function listTags(userId: string): Promise<any> {
   try {
    const tagsRef = collection(db, 'tags');
    const tagsQuery = query(
      tagsRef,
      where('userId', '==', userId),
      // Ordena da mais recente para a mais antiga
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(tagsQuery);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name as string,
        color: data.color as string,                        // ← inclua
        description: data.description as string | null,
        userId: data.userId as string,
        createdAt: (data.createdAt as Timestamp).toDate()
      };
    });
  } catch (error) {
    if (error instanceof FirestoreError) {
      console.error('Erro ao listar tags do usuário:', error.code, error.message);
    } else {
      console.error('Erro inesperado ao listar tags:', error);
    }
    throw error;
  }
}

/**
 * Asynchronously creates a new tag.
 * (Currently a mock function)
 *
 * @param tagData Data for the new tag (name, color, optional description).
 * @returns A promise that resolves to the newly created Tag object.
 */
export async function createTag(
  userId: string,
  tagData: {
    name: string;
    color: string;
    description?: string;
  }
): Promise<any> {
  try {
    const tagsRef = collection(db, 'tags');
    // Add the document with a server timestamp
    const docRef = await addDoc(tagsRef, {
      userId,
      name: tagData.name,
      color: tagData.color,
      description: tagData.description ?? null,
      createdAt: serverTimestamp()
    });

    // Read it back to get the actual server timestamp
    const snap = await getDoc(docRef);
    const data = snap.data()!;

    return {
      id: docRef.id,
      userId: data.userId as string,
      name: data.name as string,
      color: data.color as string,
      description: data.description as string | undefined,
      createdAt: (data.createdAt as Timestamp).toDate()
    };
  } catch (error) {
    if (error instanceof FirestoreError) {
      console.error('Error creating tag:', error.code, error.message);
    } else {
      console.error('Unexpected error creating tag:', error);
    }
    throw error;
  }
}

/**
 * Asynchronously updates an existing tag in Firestore.
 *
 * @param tagId ID of the tag to update.
 * @param updatedData Partial data for the tag (name, color, description).
 * @returns A promise that resolves to the fully updated Tag object.
 * @throws Error if the tag is not found or update fails.
 */
export async function updateTag(
  tagId: string,
  updatedData: {
    name?: string;
    color?: string;
    description?: string | null;
  }
): Promise<any> {
  try {
    const tagRef = doc(db, 'tags', tagId);

    // Verifica existência
    const snapBefore = await getDoc(tagRef);
    if (!snapBefore.exists()) {
      throw new Error('Tag not found.');
    }

    // Atualiza somente os campos fornecidos
    await updateDoc(tagRef, {
      ...updatedData,
      // Opcional: você pode querer preservar o createdAt original, então não o sobrescreva aqui
    });

    // Releitura para obter os campos atualizados
    const snapAfter = await getDoc(tagRef);
    const data = snapAfter.data()!;

    return {
      id: snapAfter.id,
      userId: data.userId as string,
      name: data.name as string,
      color: data.color as string,
      description: data.description as string | null,
      createdAt: (data.createdAt as Timestamp).toDate()
    };
  } catch (error) {
    if (error instanceof FirestoreError) {
      console.error('Erro ao atualizar tag:', error.code, error.message);
    } else {
      console.error('Erro inesperado ao atualizar tag:', error);
    }
    throw error;
  }
}


/**
 * Asynchronously deletes an existing tag in Firestore.
 *
 * @param tagId ID of the tag to delete.
 * @returns A promise that resolves when the tag is deleted.
 * @throws Error if the tag is not found or deletion fails.
 */
export async function deleteTag(tagId: string): Promise<void> {
  try {
    const tagRef = doc(db, 'tags', tagId);

    // Verifica se o documento existe
    const snap = await getDoc(tagRef);
    if (!snap.exists()) {
      throw new Error('Tag not found.');
    }

    // Deleta o documento
    await deleteDoc(tagRef);
    console.log(`Tag with ID ${tagId} deleted successfully.`);
  } catch (error) {
    if (error instanceof FirestoreError) {
      console.error('Erro ao deletar tag:', error.code, error.message);
    } else {
      console.error('Erro inesperado ao deletar tag:', error);
    }
    throw error;
  }
}