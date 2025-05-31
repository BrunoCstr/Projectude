import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import {
  updateProfile as updateAuthProfile,
} from "firebase/auth";
import { getInitializedFirestore, getInitializedStorage, getInitializedAuth } from "@/lib/firebase";

const db = getInitializedFirestore();
const storage = getInitializedStorage();
const auth = getInitializedAuth();

/** Busca os dados do usuário no Firestore */
export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

/**
 * Faz upload de avatar e retorna a URL pública.
 * Caminho sugerido: `avatars/{uid}/{timestamp}.{ext}`
 */
export async function uploadAvatarFile(uid: string, file: File) {
  // 1) Faz upload do arquivo
  const ext = file.name.split(".").pop();
  const ref = storageRef(storage, `avatars/${uid}/${Date.now()}.${ext}`);
  await uploadBytes(ref, file);

  // 2) Busca a URL pública
  const photoURL = await getDownloadURL(ref);

  // 3) Atualiza o campo photoURL no Firestore
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { photoURL });

  // 4) (Opcional) Sincroniza com o Auth também
  const currentUser = auth.currentUser;
  if (currentUser) {
    await updateAuthProfile(currentUser, { photoURL });
  }

  return photoURL;
}

/** Atualiza campos do perfil no Firestore e no Auth */
export async function updateUserProfile(
  uid: string,
  data: {
    displayName: string;
    username: string;
    address: {
      country: string;
      state: string;
      city: string;
      neighborhood: string;
      street: string;
    };
    socialLinks: Array<{ iconKey: string; url: string }>;
    tags: Record<string, string[]>;
    photoURL?: string
    bio: "",
  },
  photoURL?: string
) {
  const userRef = doc(db, "users", uid);

  // 1) Firestore
  await updateDoc(userRef, {
    displayName: data.displayName,
    username: data.username,
    address: data.address,
    socialLinks: data.socialLinks,
    tags: data.tags,
    bio: data.bio,
    ...(photoURL ? { photoURL } : {}),
  });

  // 2) Auth
  const currentUser = auth.currentUser;
  if (currentUser) {
    await updateAuthProfile(currentUser, {
      displayName: data.displayName,
      ...(photoURL ? { photoURL } : {}),
    });
  }
}
