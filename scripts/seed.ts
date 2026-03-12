/**
 * Seed script — creates synthetic profiles and ratings for testing.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires Firebase env vars (or GOOGLE_APPLICATION_CREDENTIALS) to be set.
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ── Firebase init ──────────────────────────────────────────────────────────
if (getApps().length === 0) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (sa) {
    initializeApp({
      credential: cert(JSON.parse(sa)),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
}
const db = getFirestore();

// ── Types (mirrored from src/lib/types.ts) ─────────────────────────────────
type Gender = "male" | "female";
type HairColor = "black" | "brown" | "blonde" | "red" | "gray" | "other";
type Race = "white" | "black" | "asian" | "hispanic" | "middle_eastern" | "other";

const GENDERS: Gender[] = ["male", "female"];
const HAIR_COLORS: HairColor[] = ["black", "brown", "blonde", "red", "gray", "other"];
const RACES: Race[] = ["white", "black", "asian", "hispanic", "middle_eastern", "other"];

function getAgeRange(age: number): string {
  if (age <= 24) return "18-24";
  if (age <= 30) return "25-30";
  if (age <= 40) return "31-40";
  if (age <= 50) return "41-50";
  return "51+";
}

// ── Helpers ────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}
function randScore(): number {
  // slight bell-curve bias toward 4-7
  const base = Math.random() * 10;
  const nudge = (Math.random() + Math.random()) / 2 * 10;
  return Math.round(((base + nudge) / 2) * 10) / 10;
}
function pastISO(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(randInt(0, 23), randInt(0, 59), randInt(0, 59));
  return d.toISOString();
}

// ── Placeholder photos (picsum with a seed so they're stable) ──────────────
function placeholderPhotos(seed: number): string[] {
  return [
    `https://picsum.photos/seed/${seed}a/400/500`,
    `https://picsum.photos/seed/${seed}b/400/500`,
  ];
}

// ── Name pools ─────────────────────────────────────────────────────────────
const MALE_FIRST = [
  "James", "Liam", "Noah", "Ethan", "Mason", "Lucas", "Oliver", "Aiden",
  "Elijah", "Logan", "Alexander", "Sebastian", "Daniel", "Matthew", "Jackson",
  "David", "Carter", "Jayden", "Wyatt", "John", "Owen", "Dylan", "Luke",
  "Gabriel", "Anthony", "Isaac", "Grayson", "Jack", "Julian", "Levi",
  "Christopher", "Joshua", "Andrew", "Lincoln", "Mateo", "Ryan", "Jaxon",
  "Nathan", "Aaron", "Isaiah", "Thomas", "Charles", "Caleb", "Josiah",
  "Christian", "Hunter", "Eli", "Jonathan", "Connor", "Landon",
];

const FEMALE_FIRST = [
  "Emma", "Olivia", "Ava", "Sophia", "Isabella", "Mia", "Charlotte", "Amelia",
  "Harper", "Evelyn", "Abigail", "Emily", "Ella", "Elizabeth", "Camila",
  "Luna", "Sofia", "Avery", "Mila", "Aria", "Scarlett", "Penelope", "Layla",
  "Chloe", "Victoria", "Madison", "Eleanor", "Grace", "Nora", "Riley",
  "Zoey", "Hannah", "Hazel", "Lily", "Ellie", "Violet", "Lillian", "Zoe",
  "Stella", "Aurora", "Natalie", "Emilia", "Everly", "Leah", "Aubrey",
  "Willow", "Addison", "Lucy", "Audrey", "Bella",
];

const LAST = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
  "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
  "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green",
  "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
  "Carter", "Roberts",
];

// ── Generate profiles ──────────────────────────────────────────────────────
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

const NUM_PROFILES = 60;
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

// ── Generate ratings ───────────────────────────────────────────────────────
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

const ratings: SyntheticRating[] = [];
// Track which pairs already exist
const ratingPairs = new Set<string>();

// Each profile rates between 5-20 other profiles
for (const rater of profiles) {
  const numToRate = randInt(5, 20);
  const candidates = profiles.filter((p) => p.uid !== rater.uid);
  // Shuffle candidates
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

// ── Compute aggregates ─────────────────────────────────────────────────────
// Build a map: ratedUserId → list of ratings received
const ratingsReceived = new Map<string, SyntheticRating[]>();
for (const r of ratings) {
  if (!ratingsReceived.has(r.ratedUserId)) ratingsReceived.set(r.ratedUserId, []);
  ratingsReceived.get(r.ratedUserId)!.push(r);
}

// Build a map: raterId → count of ratings given (for points)
const ratingsGiven = new Map<string, number>();
for (const r of ratings) {
  ratingsGiven.set(r.raterId, (ratingsGiven.get(r.raterId) || 0) + 1);
}

// Compute per-profile averages
for (const p of profiles) {
  const received = ratingsReceived.get(p.uid) || [];
  p.totalRatingsReceived = received.length;
  if (received.length > 0) {
    p.avgFaceRating =
      Math.round(
        (received.reduce((s, r) => s + r.faceScore, 0) / received.length) * 100
      ) / 100;
    p.avgOverallRating =
      Math.round(
        (received.reduce((s, r) => s + r.overallScore, 0) / received.length) * 100
      ) / 100;
  }
  p.points = (ratingsGiven.get(p.uid) || 0) * 10;
}

// Compute ratingStats aggregates per profile
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
      avgOverall:
        Math.round(((existing.avgOverall * existing.count + overall) / n) * 100) / 100,
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

// ── Write to Firestore ─────────────────────────────────────────────────────
async function seed() {
  console.log(`Seeding ${profiles.length} profiles and ${ratings.length} ratings…\n`);

  // ── 1. Also backfill existing real users who have 0 ratings ──────────
  const existingSnap = await db.collection("users").where("profileComplete", "==", true).get();
  const realUsersWithNoRatings: string[] = [];
  for (const doc of existingSnap.docs) {
    const data = doc.data();
    if (
      doc.id.startsWith("synthetic_") === false &&
      (data.totalRatingsReceived === 0 || !data.totalRatingsReceived)
    ) {
      realUsersWithNoRatings.push(doc.id);
    }
  }

  if (realUsersWithNoRatings.length > 0) {
    console.log(
      `Found ${realUsersWithNoRatings.length} real user(s) with 0 ratings — generating fake ratings for them…`
    );
  }

  // Generate ratings for real users from synthetic raters
  const extraRatings: SyntheticRating[] = [];
  for (const realUid of realUsersWithNoRatings) {
    const numRaters = randInt(8, 25);
    const shuffled = [...profiles].sort(() => Math.random() - 0.5).slice(0, numRaters);
    for (const rater of shuffled) {
      const face = randScore();
      const overall = randScore();
      extraRatings.push({
        raterId: rater.uid,
        ratedUserId: realUid,
        faceScore: face,
        overallScore: overall,
        raterGender: rater.gender,
        raterAge: rater.age,
        raterHairColor: rater.hairColor,
        raterRace: rater.race,
        createdAt: pastISO(randInt(1, 20)),
      });
    }
  }

  // Compute averages for real users and their stats
  const realUserUpdates = new Map<
    string,
    { avgFace: number; avgOverall: number; total: number; stats: StatsDoc }
  >();
  for (const realUid of realUsersWithNoRatings) {
    const received = extraRatings.filter((r) => r.ratedUserId === realUid);
    const avgFace =
      Math.round(
        (received.reduce((s, r) => s + r.faceScore, 0) / received.length) * 100
      ) / 100;
    const avgOverall =
      Math.round(
        (received.reduce((s, r) => s + r.overallScore, 0) / received.length) * 100
      ) / 100;
    realUserUpdates.set(realUid, {
      avgFace,
      avgOverall,
      total: received.length,
      stats: buildStats(received),
    });
  }

  // ── Write profiles (batched) ─────────────────────────────────────────
  const BATCH_LIMIT = 450; // Firestore batch max is 500; leave room
  let batch = db.batch();
  let ops = 0;

  for (const p of profiles) {
    batch.set(db.collection("users").doc(p.uid), p);
    ops++;
    if (ops >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) {
    await batch.commit();
    batch = db.batch();
    ops = 0;
  }
  console.log(`  ✓ ${profiles.length} synthetic profiles written`);

  // ── Write ratings (batched) ──────────────────────────────────────────
  const allRatings = [...ratings, ...extraRatings];
  for (const r of allRatings) {
    batch.set(db.collection("ratings").doc(), r);
    ops++;
    if (ops >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) {
    await batch.commit();
    batch = db.batch();
    ops = 0;
  }
  console.log(`  ✓ ${allRatings.length} ratings written`);

  // ── Write rating stats for synthetic profiles ────────────────────────
  for (const p of profiles) {
    const received = ratingsReceived.get(p.uid) || [];
    if (received.length === 0) continue;
    const stats = buildStats(received);
    batch.set(
      db.collection("users").doc(p.uid).collection("ratingStats").doc("aggregates"),
      stats
    );
    ops++;
    if (ops >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) {
    await batch.commit();
    batch = db.batch();
    ops = 0;
  }
  console.log(`  ✓ rating stats written for synthetic profiles`);

  // ── Update real users with 0 ratings ─────────────────────────────────
  for (const [uid, data] of realUserUpdates) {
    batch.update(db.collection("users").doc(uid), {
      avgFaceRating: data.avgFace,
      avgOverallRating: data.avgOverall,
      totalRatingsReceived: data.total,
    });
    batch.set(
      db.collection("users").doc(uid).collection("ratingStats").doc("aggregates"),
      data.stats
    );
    ops += 2;
    if (ops >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) {
    await batch.commit();
  }
  if (realUsersWithNoRatings.length > 0) {
    console.log(
      `  ✓ ${realUsersWithNoRatings.length} real user(s) backfilled with synthetic ratings`
    );
  }

  // ── Summary ──────────────────────────────────────────────────────────
  const withRatings = profiles.filter((p) => p.totalRatingsReceived > 0).length;
  const withoutRatings = profiles.filter((p) => p.totalRatingsReceived === 0).length;
  console.log(`\nDone!`);
  console.log(`  Profiles with ratings: ${withRatings}`);
  console.log(`  Profiles with 0 ratings: ${withoutRatings}`);
  console.log(`  Total ratings created: ${allRatings.length}`);
  console.log(
    `  Real users backfilled: ${realUsersWithNoRatings.length}`
  );
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
