/**
 * [SYNTHETIC DATA] Seed script using Firebase REST API.
 * Uses the Firebase CLI's stored refresh token — no service account needed.
 */
import { readFileSync } from "fs";
import { join } from "path";

const PROJECT_ID = "leaderboard-75c1d";

// Read Firebase CLI refresh token
const configPath = join(
  process.env.HOME || "",
  ".config/configstore/firebase-tools.json"
);
const config = JSON.parse(readFileSync(configPath, "utf-8"));
const refreshToken = config.tokens.refresh_token;

// Get access token from refresh token
async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
      client_secret: "j9iVZfS8kkCEFUPaAeJV0sAi",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get access token: " + JSON.stringify(data));
  return data.access_token;
}

// Firestore REST helpers
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function toFirestoreValue(val: unknown): Record<string, unknown> {
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "number") {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === "boolean") return { booleanValue: val };
  if (Array.isArray(val))
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (val && typeof val === "object") {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

function toFirestoreDoc(obj: Record<string, unknown>): { fields: Record<string, unknown> } {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return { fields };
}

async function writeDoc(
  token: string,
  collectionPath: string,
  docId: string,
  data: Record<string, unknown>
) {
  const url = `${FIRESTORE_URL}/${collectionPath}/${docId}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toFirestoreDoc(data)),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to write ${collectionPath}/${docId}: ${res.status} ${err}`);
  }
}

async function addDoc(
  token: string,
  collectionPath: string,
  data: Record<string, unknown>
) {
  const url = `${FIRESTORE_URL}/${collectionPath}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toFirestoreDoc(data)),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to add to ${collectionPath}: ${res.status} ${err}`);
  }
}

// Data generation
type Gender = "male" | "female";
type HairColor = "black" | "brown" | "blonde" | "red" | "gray" | "other";
type Race = "white" | "black" | "asian" | "hispanic" | "middle_eastern" | "other";

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
function humanPhotos(index: number, gender: "male" | "female"): string[] {
  const folder = gender === "male" ? "men" : "women";
  // randomuser.me has portraits 0-99 for each gender
  const id1 = index % 100;
  const id2 = (index + 50) % 100; // offset for second photo
  return [
    `https://randomuser.me/api/portraits/${folder}/${id1}.jpg`,
    `https://randomuser.me/api/portraits/${folder}/${id2}.jpg`,
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
];

interface Profile {
  uid: string; displayName: string; gender: Gender; age: number;
  hairColor: HairColor; race: Race; photos: string[];
  avgFaceRating: number; avgOverallRating: number;
  totalRatingsReceived: number; points: number;
  profileComplete: boolean; synthetic: boolean;
  createdAt: string; updatedAt: string;
}

interface Rating {
  raterId: string; ratedUserId: string; faceScore: number; overallScore: number;
  raterGender: string; raterAge: number; raterHairColor: string; raterRace: string;
  synthetic: boolean; createdAt: string;
}

async function seed() {
  console.log("Getting access token...");
  const token = await getAccessToken();
  console.log("Authenticated.");

  const NUM_PROFILES = 60;
  const profiles: Profile[] = [];
  const usedNames = new Set<string>();
  let maleIdx = 0;
  let femaleIdx = 0;

  for (let i = 0; i < NUM_PROFILES; i++) {
    const gender = pick(GENDERS);
    let name: string;
    do {
      name = `${gender === "male" ? pick(MALE_FIRST) : pick(FEMALE_FIRST)} ${pick(LAST)}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const photoIdx = gender === "male" ? maleIdx++ : femaleIdx++;
    profiles.push({
      uid: `synthetic_${i.toString().padStart(3, "0")}`,
      displayName: name, gender, age: randInt(18, 55),
      hairColor: pick(HAIR_COLORS), race: pick(RACES),
      photos: humanPhotos(photoIdx, gender),
      avgFaceRating: 0, avgOverallRating: 0,
      totalRatingsReceived: 0, points: 0,
      profileComplete: true, synthetic: true,
      createdAt: pastISO(randInt(10, 90)),
      updatedAt: pastISO(randInt(1, 9)),
    });
  }

  // Generate ratings
  const ratings: Rating[] = [];
  const ratingPairs = new Set<string>();
  for (const rater of profiles) {
    const numToRate = randInt(5, 15);
    const candidates = profiles.filter((p) => p.uid !== rater.uid);
    for (let j = candidates.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [candidates[j], candidates[k]] = [candidates[k], candidates[j]];
    }
    for (const target of candidates.slice(0, numToRate)) {
      const pairKey = `${rater.uid}:${target.uid}`;
      if (ratingPairs.has(pairKey)) continue;
      ratingPairs.add(pairKey);
      ratings.push({
        raterId: rater.uid, ratedUserId: target.uid,
        faceScore: randScore(), overallScore: randScore(),
        raterGender: rater.gender, raterAge: rater.age,
        raterHairColor: rater.hairColor, raterRace: rater.race,
        synthetic: true, createdAt: pastISO(randInt(1, 30)),
      });
    }
  }

  // Compute aggregates
  const ratingsReceived = new Map<string, Rating[]>();
  const ratingsGiven = new Map<string, number>();
  for (const r of ratings) {
    if (!ratingsReceived.has(r.ratedUserId)) ratingsReceived.set(r.ratedUserId, []);
    ratingsReceived.get(r.ratedUserId)!.push(r);
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

  // Build stats
  function buildStats(received: Rating[]) {
    const stats: Record<string, Record<string, { count: number; avgFace: number; avgOverall: number }>> = {
      byGender: {}, byHairColor: {}, byRace: {}, byAgeRange: {},
    };
    const update = (cat: Record<string, { count: number; avgFace: number; avgOverall: number }>, key: string, face: number, overall: number) => {
      const e = cat[key] || { count: 0, avgFace: 0, avgOverall: 0 };
      const n = e.count + 1;
      cat[key] = { count: n, avgFace: Math.round(((e.avgFace * e.count + face) / n) * 100) / 100, avgOverall: Math.round(((e.avgOverall * e.count + overall) / n) * 100) / 100 };
    };
    for (const r of received) {
      update(stats.byGender, r.raterGender, r.faceScore, r.overallScore);
      update(stats.byHairColor, r.raterHairColor, r.faceScore, r.overallScore);
      update(stats.byRace, r.raterRace, r.faceScore, r.overallScore);
      update(stats.byAgeRange, getAgeRange(r.raterAge), r.faceScore, r.overallScore);
    }
    return stats;
  }

  // Write profiles
  console.log(`Writing ${profiles.length} profiles...`);
  let count = 0;
  for (const p of profiles) {
    const { uid, ...data } = p;
    await writeDoc(token, "users", uid, data as unknown as Record<string, unknown>);
    count++;
    if (count % 10 === 0) console.log(`  ${count}/${profiles.length} profiles`);
  }
  console.log(`  ✓ ${profiles.length} profiles written`);

  // Write ratings (in parallel batches of 10)
  console.log(`Writing ${ratings.length} ratings...`);
  count = 0;
  for (let i = 0; i < ratings.length; i += 10) {
    const batch = ratings.slice(i, i + 10);
    await Promise.all(batch.map((r) => addDoc(token, "ratings", r as unknown as Record<string, unknown>)));
    count += batch.length;
    if (count % 50 === 0) console.log(`  ${count}/${ratings.length} ratings`);
  }
  console.log(`  ✓ ${ratings.length} ratings written`);

  // Write rating stats
  console.log("Writing rating stats...");
  count = 0;
  for (const p of profiles) {
    const received = ratingsReceived.get(p.uid) || [];
    if (received.length === 0) continue;
    const stats = buildStats(received);
    await writeDoc(token, `users/${p.uid}/ratingStats`, "aggregates", stats as unknown as Record<string, unknown>);
    count++;
  }
  console.log(`  ✓ ${count} rating stats written`);

  console.log(`\nDone! ${profiles.length} profiles, ${ratings.length} ratings.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
