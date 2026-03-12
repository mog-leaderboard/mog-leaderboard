/**
 * Client-side seed — creates synthetic profiles and ratings using
 * the Firebase client SDK (no admin SDK / service account needed).
 */
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Gender, HairColor, Race } from "./types";

const GENDERS: Gender[] = ["male", "female"];
const HAIR_COLORS: HairColor[] = ["black", "brown", "blonde", "red", "gray", "other"];
const RACES: Race[] = ["white", "black", "asian", "hispanic", "middle_eastern", "other"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}
function randScore(): number {
  const base = Math.random() * 10;
  const nudge = ((Math.random() + Math.random()) / 2) * 10;
  return Math.round(((base + nudge) / 2) * 10) / 10;
}
function pastISO(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(randInt(0, 23), randInt(0, 59), randInt(0, 59));
  return d.toISOString();
}
function getAgeRange(age: number): string {
  if (age <= 24) return "18-24";
  if (age <= 30) return "25-30";
  if (age <= 40) return "31-40";
  if (age <= 50) return "41-50";
  return "51+";
}
function placeholderPhotos(seed: number): string[] {
  return [
    `https://picsum.photos/seed/${seed}a/400/500`,
    `https://picsum.photos/seed/${seed}b/400/500`,
  ];
}

const MALE_FIRST = [
  "James","Liam","Noah","Ethan","Mason","Lucas","Oliver","Aiden",
  "Elijah","Logan","Alexander","Sebastian","Daniel","Matthew","Jackson",
  "David","Carter","Jayden","Wyatt","John","Owen","Dylan","Luke",
  "Gabriel","Anthony","Isaac","Grayson","Jack","Julian","Levi",
];
const FEMALE_FIRST = [
  "Emma","Olivia","Ava","Sophia","Isabella","Mia","Charlotte","Amelia",
  "Harper","Evelyn","Abigail","Emily","Ella","Elizabeth","Camila",
  "Luna","Sofia","Avery","Mila","Aria","Scarlett","Penelope","Layla",
  "Chloe","Victoria","Madison","Eleanor","Grace","Nora","Riley",
];
const LAST = [
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller",
  "Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez",
  "Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin",
  "Lee","Perez","Thompson","White","Harris","Sanchez","Clark",
  "Ramirez","Lewis","Robinson",
];

interface SyntheticProfile {
  uid: string;
  displayName: string;
  gender: Gender;
  age: number;
  hairColor: HairColor;
  race: Race;
  photos: string[];
  avgFaceRating: number;
  avgOverallRating: number;
  totalRatingsReceived: number;
  points: number;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SyntheticRating {
  raterId: string;
  ratedUserId: string;
  faceScore: number;
  overallScore: number;
  raterGender: Gender;
  raterAge: number;
  raterHairColor: HairColor;
  raterRace: Race;
  createdAt: string;
}

interface DemoBucket {
  count: number;
  avgFace: number;
  avgOverall: number;
}
interface StatsDoc {
  byGender: Record<string, DemoBucket>;
  byHairColor: Record<string, DemoBucket>;
  byRace: Record<string, DemoBucket>;
  byAgeRange: Record<string, DemoBucket>;
}

function buildStats(received: SyntheticRating[]): StatsDoc {
  const stats: StatsDoc = { byGender: {}, byHairColor: {}, byRace: {}, byAgeRange: {} };
  const updateBucket = (
    cat: Record<string, DemoBucket>,
    key: string,
    face: number,
    overall: number
  ) => {
    const existing = cat[key] || { count: 0, avgFace: 0, avgOverall: 0 };
    const n = existing.count + 1;
    cat[key] = {
      count: n,
      avgFace: Math.round(((existing.avgFace * existing.count + face) / n) * 100) / 100,
      avgOverall: Math.round(((existing.avgOverall * existing.count + overall) / n) * 100) / 100,
    };
  };
  for (const r of received) {
    updateBucket(stats.byGender, r.raterGender, r.faceScore, r.overallScore);
    updateBucket(stats.byHairColor, r.raterHairColor, r.faceScore, r.overallScore);
    updateBucket(stats.byRace, r.raterRace, r.faceScore, r.overallScore);
    updateBucket(stats.byAgeRange, getAgeRange(r.raterAge), r.faceScore, r.overallScore);
  }
  return stats;
}

export async function seedDatabase(
  onProgress: (msg: string) => void
): Promise<void> {
  const NUM_PROFILES = 60;

  onProgress("Generating profiles...");

  // Generate profiles
  const profiles: SyntheticProfile[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < NUM_PROFILES; i++) {
    const gender = pick(GENDERS);
    let name: string;
    do {
      const first = gender === "male" ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
      const last = pick(LAST);
      name = `${first} ${last}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    profiles.push({
      uid: `synthetic_${i.toString().padStart(3, "0")}`,
      displayName: name,
      gender,
      age: randInt(18, 55),
      hairColor: pick(HAIR_COLORS),
      race: pick(RACES),
      photos: placeholderPhotos(i),
      avgFaceRating: 0,
      avgOverallRating: 0,
      totalRatingsReceived: 0,
      points: 0,
      profileComplete: true,
      createdAt: pastISO(randInt(10, 90)),
      updatedAt: pastISO(randInt(1, 9)),
    });
  }

  onProgress("Generating ratings...");

  // Generate ratings
  const ratings: SyntheticRating[] = [];
  const ratingPairs = new Set<string>();

  for (const rater of profiles) {
    const numToRate = randInt(5, 20);
    const candidates = profiles.filter((p) => p.uid !== rater.uid);
    for (let j = candidates.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [candidates[j], candidates[k]] = [candidates[k], candidates[j]];
    }
    const toRate = candidates.slice(0, numToRate);

    for (const target of toRate) {
      const pairKey = `${rater.uid}:${target.uid}`;
      if (ratingPairs.has(pairKey)) continue;
      ratingPairs.add(pairKey);

      ratings.push({
        raterId: rater.uid,
        ratedUserId: target.uid,
        faceScore: randScore(),
        overallScore: randScore(),
        raterGender: rater.gender,
        raterAge: rater.age,
        raterHairColor: rater.hairColor,
        raterRace: rater.race,
        createdAt: pastISO(randInt(1, 30)),
      });
    }
  }

  // Compute aggregates
  const ratingsReceived = new Map<string, SyntheticRating[]>();
  for (const r of ratings) {
    if (!ratingsReceived.has(r.ratedUserId)) ratingsReceived.set(r.ratedUserId, []);
    ratingsReceived.get(r.ratedUserId)!.push(r);
  }
  const ratingsGiven = new Map<string, number>();
  for (const r of ratings) {
    ratingsGiven.set(r.raterId, (ratingsGiven.get(r.raterId) || 0) + 1);
  }

  for (const p of profiles) {
    const received = ratingsReceived.get(p.uid) || [];
    p.totalRatingsReceived = received.length;
    if (received.length > 0) {
      p.avgFaceRating = Math.round((received.reduce((s, r) => s + r.faceScore, 0) / received.length) * 100) / 100;
      p.avgOverallRating = Math.round((received.reduce((s, r) => s + r.overallScore, 0) / received.length) * 100) / 100;
    }
    p.points = (ratingsGiven.get(p.uid) || 0) * 10;
  }

  // Also backfill real users with 0 ratings
  onProgress("Checking for real users to backfill...");
  const existingSnap = await getDocs(
    query(collection(db, "users"), where("profileComplete", "==", true))
  );
  const extraRatings: SyntheticRating[] = [];
  const realUsersToBackfill: string[] = [];

  for (const d of existingSnap.docs) {
    if (d.id.startsWith("synthetic_")) continue;
    const data = d.data();
    if (!data.totalRatingsReceived || data.totalRatingsReceived === 0) {
      realUsersToBackfill.push(d.id);
    }
  }

  for (const realUid of realUsersToBackfill) {
    const numRaters = randInt(8, 25);
    const shuffled = [...profiles].sort(() => Math.random() - 0.5).slice(0, numRaters);
    for (const rater of shuffled) {
      extraRatings.push({
        raterId: rater.uid,
        ratedUserId: realUid,
        faceScore: randScore(),
        overallScore: randScore(),
        raterGender: rater.gender,
        raterAge: rater.age,
        raterHairColor: rater.hairColor,
        raterRace: rater.race,
        createdAt: pastISO(randInt(1, 20)),
      });
    }
  }

  // Write profiles
  onProgress(`Writing ${profiles.length} profiles...`);
  const BATCH_LIMIT = 450;
  let batch = writeBatch(db);
  let ops = 0;

  for (const p of profiles) {
    batch.set(doc(db, "users", p.uid), p);
    ops++;
    if (ops >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }
  if (ops > 0) {
    await batch.commit();
    batch = writeBatch(db);
    ops = 0;
  }
  onProgress(`${profiles.length} profiles written`);

  // Write ratings
  const allRatings = [...ratings, ...extraRatings];
  onProgress(`Writing ${allRatings.length} ratings...`);
  for (const r of allRatings) {
    const ratingRef = doc(collection(db, "ratings"));
    batch.set(ratingRef, r);
    ops++;
    if (ops >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }
  if (ops > 0) {
    await batch.commit();
    batch = writeBatch(db);
    ops = 0;
  }
  onProgress(`${allRatings.length} ratings written`);

  // Write rating stats for synthetic profiles
  onProgress("Writing rating stats...");
  for (const p of profiles) {
    const received = ratingsReceived.get(p.uid) || [];
    if (received.length === 0) continue;
    const stats = buildStats(received);
    batch.set(doc(db, "users", p.uid, "ratingStats", "aggregates"), stats);
    ops++;
    if (ops >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }
  if (ops > 0) {
    await batch.commit();
    batch = writeBatch(db);
    ops = 0;
  }

  // Update real users with backfilled ratings
  for (const realUid of realUsersToBackfill) {
    const received = extraRatings.filter((r) => r.ratedUserId === realUid);
    const avgFace = Math.round((received.reduce((s, r) => s + r.faceScore, 0) / received.length) * 100) / 100;
    const avgOverall = Math.round((received.reduce((s, r) => s + r.overallScore, 0) / received.length) * 100) / 100;
    const stats = buildStats(received);

    await setDoc(doc(db, "users", realUid), {
      avgFaceRating: avgFace,
      avgOverallRating: avgOverall,
      totalRatingsReceived: received.length,
    }, { merge: true });
    await setDoc(doc(db, "users", realUid, "ratingStats", "aggregates"), stats);
  }

  onProgress(
    `Done! ${profiles.length} profiles, ${allRatings.length} ratings. ` +
    `${realUsersToBackfill.length} real user(s) backfilled.`
  );
}
