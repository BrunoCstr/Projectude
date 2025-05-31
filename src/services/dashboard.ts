import {
  collection,
  query,
  where,
  getCountFromServer,
  getDocs,
  collectionGroup,
} from "firebase/firestore";
import { getInitializedFirestore } from "@/lib/firebase";

export async function countUserProjects(uid: string) {
  const db = getInitializedFirestore();

  const q = query(collection(db, "projects"), where("creatorUID", "==", uid));
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

export async function countSharedProjects(uid: string) {
  const db = getInitializedFirestore();

  const projectsSnapshot = await getDocs(collection(db, "projects"));
  let sharedCount = 0;

  projectsSnapshot.forEach((project) => {
    const collaborators = project.data().collaborators || [];
    if (collaborators.some((col: any) => col.id === uid)) {
      sharedCount++;
    }
  });

  return sharedCount;
}

export async function countUserCollaborators(userId: string) {
  const db = getInitializedFirestore();
  const userCollaboratorsRef = collection(db, "users", userId, "collaborators");
  const snapshot = await getCountFromServer(userCollaboratorsRef);
  return snapshot.data().count;
}

export async function getProjectsByMonth(userId: string) {
  const db = getInitializedFirestore();
  const q = query(
    collection(db, "projects"),
    where("creatorUID", "==", userId)
  );
  const snapshot = await getDocs(q);

  const months = Array(12).fill(0);
  const currentYear = new Date().getFullYear();

  snapshot.forEach((doc) => {
    const raw = doc.data().createdAt;

    let createdAt: Date | null = null;

    if (raw instanceof Date) {
      createdAt = raw;
    } else if (raw?.toDate) {
      createdAt = raw.toDate();
    } else if (typeof raw === "string" || typeof raw === "number") {
      createdAt = new Date(raw);
    }

    if (createdAt && createdAt.getFullYear() === currentYear) {
      months[createdAt.getMonth()]++;
    }
  });

  return months;
}

export async function getProjectStatusDistribution(userId: string) {
  const db = getInitializedFirestore();

  const q = query(
    collection(db, "projects"),
    where("creatorUID", "==", userId)
  );
  const snapshot = await getDocs(q);

  const statusCount: Record<string, number> = {
    "Em Andamento": 0,
    Pendente: 0,
    Pausado: 0,
    Concluído: 0,
  };

  snapshot.forEach((doc) => {
    const status = doc.data().status;
    if (statusCount.hasOwnProperty(status)) {
      statusCount[status]++;
    }
  });

  return statusCount;
}

export async function getCollaboratorsPerProject(userId: string) {
  const db = getInitializedFirestore();

  // Busca somente os projetos do usuário autenticado
  const q = query(
    collection(db, "projects"),
    where("creatorUID", "==", userId)
  );
  const snapshot = await getDocs(q);

  const result: {
    project: string;
    collaborators: number;
    collaboratorNames: string[];
  }[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const name = data.name || "Projeto sem nome";
    const collaborators = Array.isArray(data.collaborators)
      ? data.collaborators
      : [];

    const collaboratorNames = collaborators.map(
      (col: any) => col.name || "Sem nome"
    );

    result.push({
      project: name,
      collaborators: collaborators.length,
      collaboratorNames,
    });
  });

  return result;
}

export async function listUserCollaborators(userId: string) {
  const db = getInitializedFirestore();

  const collabRef = collection(db, "users", userId, "collaborators");
  const snapshot = await getDocs(collabRef);

  const collaborators = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || "Sem nome",
      email: data.email || null,
      photoURL: data.photoURL || null,
    };
  });

  return collaborators;
}

export async function getTotalInvestment(userId: string) {
  const db = getInitializedFirestore();

  const q = query(
    collection(db, "projects"),
    where("creatorUID", "==", userId)
  );
  const snapshot = await getDocs(q);

  let totalInvestment = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const investment = data.investment;

    if (!isNaN(investment)) {
      totalInvestment += investment;
    }
  });

  return totalInvestment;
}

export async function getTotalInvestmentOfTheYear(userId: string) {
  const db = getInitializedFirestore();

  const q = query(
    collection(db, "projects"),
    where("creatorUID", "==", userId)
  );
  const snapshot = await getDocs(q);

  const totalInvestmentOfTheYear = Array(12).fill(0);

  snapshot.forEach((doc) => {
    const data = doc.data();
    const investment = data.investment;
    const startDate = data.startDate;

    if (!isNaN(investment) && typeof startDate === "string") {
      const date = new Date(startDate);
      if (!isNaN(date.getTime())) {
        const month = date.getMonth(); // 0 (jan) a 11 (dez)
        totalInvestmentOfTheYear[month] += investment;
      }
    }
  });

  return totalInvestmentOfTheYear;
}
