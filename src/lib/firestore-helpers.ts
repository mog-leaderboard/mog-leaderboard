import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  setDoc,
  orderBy,
  limit,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { getAgeRange, POINTS_PER_RATING, type UserProfile } from "./types";

export async function getNextUserToRate(currentUid: string): Promise<{
  uid: string;
  displayName: string;
  photos: string[];
} | null> {
  // Get IDs of users already rated
  const ratingsSnap = await getDocs(
    query(collection(db, "ratings"), where("raterId", "==", currentUid))
  );
  const ratedUserIds = new Set(ratingsSnap.docs.map((d) => d.data().ratedUserId));
  ratedUserIds.add(currentUid);

  // Get users with complete profiles
  const usersSnap = await getDocs(
    query(collection(db, "users"), where("profileComplete", "==", true), limit(50))
  );

  const candidates = usersSnap.docs.filter((d) => !ratedUserIds.has(d.id));
  if (candidates.length === 0) return null;

  const randomUser = candidates[Math.floor(Math.random() * candidates.length)];
  const data = randomUser.data();
  return {
    uid: randomUser.id,
    displayName: data.displayName,
    photos: data.photos,
  };
}

export async function submitRating(
  raterId: string,
  ratedUserId: string,
  faceScore: number,
  overallScore: number
) {
  // Get rater profile
  const raterDoc = await getDoc(doc(db, "users", raterId));
  if (!raterDoc.exists()) throw new Error("Rater profile not found");
  const rater = raterDoc.data() as UserProfile;

  // Check for duplicate
  const existingSnap = await getDocs(
    query(
      collection(db, "ratings"),
      where("raterId", "==", raterId),
      where("ratedUserId", "==", ratedUserId),
      limit(1)
    )
  );
  if (!existingSnap.empty) throw new Error("Already rated");

  // Save rating
  await addDoc(collection(db, "ratings"), {
    raterId,
    ratedUserId,
    faceScore,
    overallScore,
    raterGender: rater.gender,
    raterAge: rater.age,
    raterHairColor: rater.hairColor,
    raterRace: rater.race,
    createdAt: new Date().toISOString(),
  });

  // Recompute averages for rated user
  const allRatings = await getDocs(
    query(collection(db, "ratings"), where("ratedUserId", "==", ratedUserId))
  );
  let totalFace = 0;
  let totalOverall = 0;
  allRatings.docs.forEach((d) => {
    totalFace += d.data().faceScore;
    totalOverall += d.data().overallScore;
  });
  const count = allRatings.size;

  await updateDoc(doc(db, "users", ratedUserId), {
    avgFaceRating: totalFace / count,
    avgOverallRating: totalOverall / count,
    totalRatingsReceived: count,
  });

  // Award points to rater
  await updateDoc(doc(db, "users", raterId), {
    points: increment(POINTS_PER_RATING),
  });

  // Update demographic stats
  const ageRange = getAgeRange(rater.age);
  const statsRef = doc(db, "users", ratedUserId, "ratingStats", "aggregates");
  const statsDoc = await getDoc(statsRef);
  const stats = statsDoc.exists()
    ? statsDoc.data()!
    : { byGender: {}, byHairColor: {}, byRace: {}, byAgeRange: {} };

  const updateBucket = (
    category: Record<string, { count: number; avgFace: number; avgOverall: number }>,
    key: string
  ) => {
    const existing = category[key] || { count: 0, avgFace: 0, avgOverall: 0 };
    const newCount = existing.count + 1;
    category[key] = {
      count: newCount,
      avgFace: (existing.avgFace * existing.count + faceScore) / newCount,
      avgOverall: (existing.avgOverall * existing.count + overallScore) / newCount,
    };
  };

  updateBucket(stats.byGender, rater.gender);
  updateBucket(stats.byHairColor, rater.hairColor);
  updateBucket(stats.byRace, rater.race);
  updateBucket(stats.byAgeRange, ageRange);

  await setDoc(statsRef, stats);

  return { pointsEarned: POINTS_PER_RATING };
}

export async function getLeaderboard(genderFilter?: string) {
  // Simple query to avoid needing composite indexes
  const usersSnap = await getDocs(
    query(
      collection(db, "users"),
      where("profileComplete", "==", true),
      limit(500)
    )
  );

  let users = usersSnap.docs
    .map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        displayName: data.displayName,
        photo: data.photos?.[0] || "",
        avgOverallRating: data.avgOverallRating || 0,
        avgFaceRating: data.avgFaceRating || 0,
        totalRatingsReceived: data.totalRatingsReceived || 0,
        gender: data.gender,
      };
    })
    .filter((u) => u.totalRatingsReceived > 0);

  if (genderFilter && (genderFilter === "male" || genderFilter === "female")) {
    users = users.filter((u) => u.gender === genderFilter);
  }

  users.sort((a, b) => {
    if (b.avgOverallRating !== a.avgOverallRating) return b.avgOverallRating - a.avgOverallRating;
    return b.totalRatingsReceived - a.totalRatingsReceived;
  });

  return users.slice(0, 100);
}

export async function getUserStats(uid: string): Promise<{
  stats: { byGender: Record<string, unknown>; byHairColor: Record<string, unknown>; byRace: Record<string, unknown>; byAgeRange: Record<string, unknown> };
  avgFaceRating: number;
  avgOverallRating: number;
  totalRatingsReceived: number;
}> {
  const [statsDoc, userDoc] = await Promise.all([
    getDoc(doc(db, "users", uid, "ratingStats", "aggregates")),
    getDoc(doc(db, "users", uid)),
  ]);

  const userData = userDoc.data();
  return {
    stats: (statsDoc.exists()
      ? statsDoc.data()
      : { byGender: {}, byHairColor: {}, byRace: {}, byAgeRange: {} }) as {
        byGender: Record<string, unknown>;
        byHairColor: Record<string, unknown>;
        byRace: Record<string, unknown>;
        byAgeRange: Record<string, unknown>;
      },
    avgFaceRating: userData?.avgFaceRating || 0,
    avgOverallRating: userData?.avgOverallRating || 0,
    totalRatingsReceived: userData?.totalRatingsReceived || 0,
  };
}

export async function getUserRatingsRaw(uid: string) {
  const snap = await getDocs(
    query(collection(db, "ratings"), where("ratedUserId", "==", uid))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      faceScore: data.faceScore as number,
      overallScore: data.overallScore as number,
      raterGender: data.raterGender as string,
      raterAge: data.raterAge as number,
      raterHairColor: data.raterHairColor as string,
      raterRace: data.raterRace as string,
    };
  });
}

export async function getRatingHistory(uid: string) {
  // Simple query without orderBy to avoid needing composite index
  const snap = await getDocs(
    query(
      collection(db, "ratings"),
      where("raterId", "==", uid),
      limit(50)
    )
  );
  const results = snap.docs.map((d) => ({
    ratedUserId: d.data().ratedUserId,
    createdAt: d.data().createdAt,
  }));
  // Sort client-side
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return results.slice(0, 20);
}
