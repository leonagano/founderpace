import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo";
import {
  LeaderboardCacheDoc,
  LeaderboardEntry,
  LeaderboardPeriod,
  StatsDoc,
  UserDoc,
} from "@/lib/types";

const usersCollection = "users";
const statsCollection = "stats";
const leaderboardCollection = "leaderboard_cache";

export const upsertUser = async (user: UserDoc) => {
  const db = await getDb();
  const { strava_id, ...rest } = user;
  const { created_at, ...upsertFields } = rest;
  const result = await db.collection<UserDoc>(usersCollection).findOneAndUpdate(
    { strava_id },
    {
      $set: {
        ...upsertFields,
        strava_id,
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
  if (startupName) {
    update.startup_name = startupName;
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

