import {
  addDoc,
  query,
  orderBy,
  limit,
  doc,
  deleteDoc,
  updateDoc,
  collection,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { LeaderboardEntry } from "../model/LeaderboardInterfaces";

const leaderboardCollectionRef = collection(db, "Leaderboard");

export const addNewScore = async (name: string, highscore: number) => {
  try {
    const topScores = await getTopScores();
    if (
      topScores.length < 10 ||
      highscore > topScores[topScores.length - 1].highscore
    ) {
      await addDoc(leaderboardCollectionRef, {
        name,
        highscore,
        createdAt: new Date(),
      });

      if (topScores.length >= 10) {
        const lowestScoreDoc = topScores[topScores.length - 1];
        await deleteScore(lowestScoreDoc.id);
      }
    }
  } catch (error) {
    console.error("Error adding new score: ", error);
    throw error;
  }
};

export const getTopScores = async (): Promise<LeaderboardEntry[]> => {
  const topScoresQuery = query(
    leaderboardCollectionRef,
    orderBy("highscore", "desc"),
    limit(10)
  );
  const querySnapshot = await getDocs(topScoresQuery);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as LeaderboardEntry[];
};

export const listenToLeaderboard = (
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void
): (() => void) => {
  const leaderboardQuery = query(
    leaderboardCollectionRef,
    orderBy("highscore", "desc"),
    limit(10)
  );

  const unsubscribe = onSnapshot(leaderboardQuery, (snapshot) => {
    const leaderboardData: LeaderboardEntry[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as LeaderboardEntry[];
    setLeaderboard(leaderboardData);
  });

  return unsubscribe;
};

export const deleteScore = async (id: string) => {
  const scoreDoc = doc(leaderboardCollectionRef, id);
  await deleteDoc(scoreDoc);
};

export const updateScore = async (id: string, score: number, name: string) => {
  const scoreDoc = doc(leaderboardCollectionRef, id);
  await updateDoc(scoreDoc, { score, name });
};
