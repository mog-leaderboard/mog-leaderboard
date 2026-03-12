export type Gender = "male" | "female";
export type HairColor = "black" | "brown" | "blonde" | "red" | "gray" | "other";
export type Race =
  | "white"
  | "black"
  | "asian"
  | "hispanic"
  | "middle_eastern"
  | "other";

export interface UserProfile {
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
  solanaWallet?: string;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Rating {
  id?: string;
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

export interface DemographicStat {
  count: number;
  avgFace: number;
  avgOverall: number;
}

export interface RatingStats {
  byGender: Record<string, DemographicStat>;
  byHairColor: Record<string, DemographicStat>;
  byRace: Record<string, DemographicStat>;
  byAgeRange: Record<string, DemographicStat>;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photo: string;
  avgOverallRating: number;
  avgFaceRating: number;
  totalRatingsReceived: number;
  gender: Gender;
}

export interface PointsHistoryEntry {
  ratedUserId: string;
  ratedUserName: string;
  pointsEarned: number;
  createdAt: string;
}

export const HAIR_COLOR_OPTIONS: { value: HairColor; label: string }[] = [
  { value: "black", label: "Black" },
  { value: "brown", label: "Brown" },
  { value: "blonde", label: "Blonde" },
  { value: "red", label: "Red" },
  { value: "gray", label: "Gray" },
  { value: "other", label: "Other" },
];

export const RACE_OPTIONS: { value: Race; label: string }[] = [
  { value: "white", label: "White" },
  { value: "black", label: "Black" },
  { value: "asian", label: "Asian" },
  { value: "hispanic", label: "Hispanic" },
  { value: "middle_eastern", label: "Middle Eastern" },
  { value: "other", label: "Other" },
];

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export const AGE_RANGES = ["18-24", "25-30", "31-40", "41-50", "51+"] as const;

export function getAgeRange(age: number): string {
  if (age <= 24) return "18-24";
  if (age <= 30) return "25-30";
  if (age <= 40) return "31-40";
  if (age <= 50) return "41-50";
  return "51+";
}

export const POINTS_PER_RATING = 10;
