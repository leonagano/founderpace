import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo";
import {
  ChallengeDoc,
  ChallengeParticipantDoc,
  ChallengeLeaderboardEntry,
  LeaderboardCacheDoc,
  LeaderboardEntry,
  LeaderboardPeriod,
  StatsDoc,
  UserDoc,
} from "@/lib/types";
import { nameToSlug, generateUniqueSlug } from "@/lib/slug";

const usersCollection = "users";
const statsCollection = "stats";
const leaderboardCollection = "leaderboard_cache";
const challengesCollection = "challenges";
const challengeParticipantsCollection = "challenge_participants";

export const upsertUser = async (user: UserDoc) => {
  const db = await getDb();
  const { strava_id, ...rest } = user;
  const { created_at, ...upsertFields } = rest;
  
  // Check if user already exists
  const existingUser = await db.collection<UserDoc>(usersCollection).findOne({ strava_id });
  
  // Generate slug if name changed or user is new
  let slug = existingUser?.slug;
  if (!slug || existingUser?.name !== user.name) {
    const baseSlug = nameToSlug(user.name);
    slug = await generateUniqueSlug(
      baseSlug,
      async (s, excludeId) => {
        const existing = await db.collection<UserDoc>(usersCollection).findOne({ slug: s });
        if (!existing) return false;
        // If updating existing user, exclude their own ID
        if (excludeId && existing._id?.toString() === excludeId) return false;
        return true;
      },
      existingUser?._id?.toString()
    );
  }
  
  const result = await db.collection<UserDoc>(usersCollection).findOneAndUpdate(
    { strava_id },
    {
      $set: {
        ...upsertFields,
        strava_id,
        slug,
        updated_at: new Date().toISOString(),
      },
      $setOnInsert: {
        created_at: created_at ?? new Date().toISOString(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );
  // If result is null (shouldn't happen, but handle edge case), fetch the user
  if (result) {
    return result;
  }
  // Fallback: fetch the user by strava_id
  const fetched = await db.collection<UserDoc>(usersCollection).findOne({ strava_id });
  if (!fetched) {
    throw new Error("Failed to upsert user");
  }
  return fetched;
};

export const updateUserSocials = async (
  userId: string,
  socials: NonNullable<UserDoc["socials"]>,
  startupName?: string
) => {
  const db = await getDb();
  const update: Partial<UserDoc> = {
    socials,
    updated_at: new Date().toISOString(),
  };
  // Always update startup_name if provided (even if empty string)
  if (startupName !== undefined) {
    update.startup_name = startupName || undefined;
  }
  await db.collection<UserDoc>(usersCollection).updateOne(
    { _id: new ObjectId(userId) },
    { $set: update }
  );
};

export const getUserById = async (id: string) => {
  const db = await getDb();
  return db
    .collection<UserDoc>(usersCollection)
    .findOne({ _id: new ObjectId(id) });
};

export const getUserBySlug = async (slug: string) => {
  const db = await getDb();
  return db.collection<UserDoc>(usersCollection).findOne({ slug });
};

export const getUserByStravaId = async (stravaId: string) => {
  const db = await getDb();
  return db.collection<UserDoc>(usersCollection).findOne({ strava_id: stravaId });
};

export const upsertStats = async (stats: StatsDoc) => {
  const db = await getDb();
  await db.collection<StatsDoc>(statsCollection).updateOne(
    { user_id: stats.user_id },
    { $set: stats },
    { upsert: true }
  );
};

export const getStatsForUser = async (userId: string) => {
  const db = await getDb();
  return db.collection<StatsDoc>(statsCollection).findOne({ user_id: userId });
};

export const getStatsForUsers = async (userIds: string[]) => {
  const db = await getDb();
  return db
    .collection<StatsDoc>(statsCollection)
    .find({ user_id: { $in: userIds } })
    .toArray();
};

export const getLeaderboardCache = async (period: LeaderboardPeriod) => {
  const db = await getDb();
  return db
    .collection<LeaderboardCacheDoc>(leaderboardCollection)
    .findOne({ period });
};

export const updateLeaderboardCache = async (
  period: LeaderboardPeriod,
  entries: LeaderboardEntry[]
) => {
  const db = await getDb();
  const doc: LeaderboardCacheDoc = {
    period,
    entries,
    updated_at: new Date().toISOString(),
  };
  await db
    .collection<LeaderboardCacheDoc>(leaderboardCollection)
    .updateOne({ period }, { $set: doc }, { upsert: true });
  return doc;
};

// Challenge Repository Functions
export const createChallenge = async (challenge: ChallengeDoc) => {
  const db = await getDb();
  const doc: ChallengeDoc = {
    ...challenge,
    created_at: new Date().toISOString(),
  };
  const result = await db.collection<ChallengeDoc>(challengesCollection).insertOne(doc);
  return { ...doc, _id: result.insertedId };
};

export const getChallengeById = async (id: string) => {
  const db = await getDb();
  return db
    .collection<ChallengeDoc>(challengesCollection)
    .findOne({ _id: new ObjectId(id) });
};

export const getActiveChallenges = async () => {
  const db = await getDb();
  const now = new Date().toISOString();
  return db
    .collection<ChallengeDoc>(challengesCollection)
    .find({
      start_date: { $lte: now },
      end_date: { $gte: now },
    })
    .sort({ created_at: -1 })
    .toArray();
};

export const getActiveChallengesWithParticipantCounts = async (limit?: number) => {
  const db = await getDb();
  const now = new Date().toISOString();
  const challenges = await db
    .collection<ChallengeDoc>(challengesCollection)
    .find({
      start_date: { $lte: now },
      end_date: { $gte: now },
    })
    .toArray();

  // Get participant counts for each challenge
  const challengesWithCounts = await Promise.all(
    challenges.map(async (challenge) => {
      const participants = await db
        .collection<ChallengeParticipantDoc>(challengeParticipantsCollection)
        .countDocuments({ challenge_id: challenge._id?.toString() ?? "" });
      return {
        challenge,
        participantCount: participants,
      };
    })
  );

  // Sort by participant count (descending) and limit
  const sorted = challengesWithCounts.sort((a, b) => b.participantCount - a.participantCount);
  return limit ? sorted.slice(0, limit) : sorted;
};

export const getUpcomingChallenges = async () => {
  const db = await getDb();
  const now = new Date().toISOString();
  return db
    .collection<ChallengeDoc>(challengesCollection)
    .find({
      start_date: { $gt: now },
    })
    .sort({ start_date: 1 })
    .toArray();
};

export const getCompletedChallenges = async () => {
  const db = await getDb();
  const now = new Date().toISOString();
  return db
    .collection<ChallengeDoc>(challengesCollection)
    .find({
      end_date: { $lt: now },
    })
    .sort({ end_date: -1 })
    .toArray();
};

export const getAllChallenges = async () => {
  const db = await getDb();
  return db
    .collection<ChallengeDoc>(challengesCollection)
    .find()
    .sort({ created_at: -1 })
    .toArray();
};

export const joinChallenge = async (
  challengeId: string,
  userId: string
): Promise<ChallengeParticipantDoc> => {
  const db = await getDb();
  const existing = await db
    .collection<ChallengeParticipantDoc>(challengeParticipantsCollection)
    .findOne({ challenge_id: challengeId, user_id: userId });

  if (existing) {
    return existing;
  }

  const participant: ChallengeParticipantDoc = {
    challenge_id: challengeId,
    user_id: userId,
    joined_at: new Date().toISOString(),
    progress: {
      km_completed: 0,
      minutes_completed: 0,
      attempts_log: [],
    },
    completed: false,
  };

  const result = await db
    .collection<ChallengeParticipantDoc>(challengeParticipantsCollection)
    .insertOne(participant);
  return { ...participant, _id: result.insertedId };
};

export const getChallengeParticipant = async (challengeId: string, userId: string) => {
  const db = await getDb();
  return db
    .collection<ChallengeParticipantDoc>(challengeParticipantsCollection)
    .findOne({ challenge_id: challengeId, user_id: userId });
};

export const getChallengeParticipants = async (challengeId: string) => {
  const db = await getDb();
  return db
    .collection<ChallengeParticipantDoc>(challengeParticipantsCollection)
    .find({ challenge_id: challengeId })
    .toArray();
};

export const getUserChallenges = async (userId: string) => {
  const db = await getDb();
  const participants = await db
    .collection<ChallengeParticipantDoc>(challengeParticipantsCollection)
    .find({ user_id: userId })
    .toArray();

  // Get challenge details for each participant
  const challengeIds = participants.map((p) => new ObjectId(p.challenge_id));
  const challenges = await db
    .collection<ChallengeDoc>(challengesCollection)
    .find({ _id: { $in: challengeIds } })
    .toArray();

  // Combine challenge and participant data
  const challengeMap = new Map(challenges.map((c) => [c._id?.toString() ?? "", c]));
  return participants
    .map((participant) => {
      const challenge = challengeMap.get(participant.challenge_id);
      if (!challenge) return null;
      return {
        challenge,
        participant,
      };
    })
    .filter((item): item is { challenge: typeof challenges[0]; participant: typeof participants[0] } => item !== null);
};

export const updateChallengeParticipantProgress = async (
  challengeId: string,
  userId: string,
  progress: ChallengeParticipantDoc["progress"],
  completed: boolean
) => {
  const db = await getDb();
  await db
    .collection<ChallengeParticipantDoc>(challengeParticipantsCollection)
    .updateOne(
      { challenge_id: challengeId, user_id: userId },
      { $set: { progress, completed } }
    );
};

export const getChallengeLeaderboard = async (
  challengeId: string
): Promise<ChallengeLeaderboardEntry[]> => {
  const db = await getDb();
  const participants = await getChallengeParticipants(challengeId);
  const userIds = participants.map((p) => p.user_id);
  const users = await db
    .collection<UserDoc>(usersCollection)
    .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } })
    .toArray();

  const userMap = new Map(users.map((u) => [u._id?.toString() ?? "", u]));
  const challenge = await getChallengeById(challengeId);

  if (!challenge) {
    return [];
  }

  const entries: ChallengeLeaderboardEntry[] = participants
    .map((participant) => {
      const user = userMap.get(participant.user_id);
      if (!user) return null;

      let progressMetric = 0;
      if (challenge.ruleset_type === "distance_total" || challenge.ruleset_type === "distance_recurring") {
        progressMetric = participant.progress.km_completed;
      } else if (challenge.ruleset_type === "duration_total" || challenge.ruleset_type === "duration_recurring") {
        progressMetric = participant.progress.minutes_completed;
      } else if (challenge.ruleset_type === "frequency_based") {
        // Calculate frequency percentage
        const weeks = Math.ceil(
          (new Date(challenge.end_date).getTime() - new Date(challenge.start_date).getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        );
        const requiredRuns = (challenge.ruleset_config.required_frequency || 0) * weeks;
        const actualRuns = participant.progress.attempts_log.length;
        progressMetric = requiredRuns > 0 ? (actualRuns / requiredRuns) * 100 : 0;
      }

      const entry: ChallengeLeaderboardEntry = {
        user_id: participant.user_id,
        slug: user.slug,
        name: user.name,
        startup_name: user.startup_name,
        profile_image: user.profile_image,
        progress_metric: progressMetric,
        completed: participant.completed,
        daily_status: participant.progress.daily_status,
      };
      return entry;
    })
    .filter((e): e is ChallengeLeaderboardEntry => e !== null)
    .sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? -1 : 1;
      }
      return b.progress_metric - a.progress_metric;
    });

  return entries;
};

