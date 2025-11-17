import { MongoClient, ServerApiVersion } from "mongodb";
import { env } from "@/lib/env";

declare global {
  var __mongoClientPromise__: Promise<MongoClient> | undefined;
}

const uri = env.MONGODB_URI;

const getClientPromise = () => {
  if (!global.__mongoClientPromise__) {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    global.__mongoClientPromise__ = client.connect();
  }
  return global.__mongoClientPromise__;
};

export const getDb = async () => {
  const client = await getClientPromise();
  return client.db(env.MONGODB_DB_NAME);
};

export const closeMongo = async () => {
  if (global.__mongoClientPromise__) {
    const client = await global.__mongoClientPromise__;
    await client.close();
    global.__mongoClientPromise__ = undefined;
  }
};

