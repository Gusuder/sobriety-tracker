import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { DayEntry, CrisisSession } from "@/domain/types";

type SobrietyDBSchema = DBSchema & {
  day_entries: {
    key: string;
    value: DayEntry;
    indexes: { "by-updatedAt": number };
  };
  crisis_sessions: {
    key: string;
    value: CrisisSession;
    indexes: { "by-startAt": number };
  };
  app_meta: {
    key: string;
    value: { key: string; value: unknown; updatedAt: number };
  };
};

const DB_NAME = "sobriety_tracker";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<SobrietyDBSchema>> | null = null;

function upgradeV1(db: IDBPDatabase<SobrietyDBSchema>) {
  const day = db.createObjectStore("day_entries", { keyPath: "dateKey" });
  day.createIndex("by-updatedAt", "updatedAt");

  const crisis = db.createObjectStore("crisis_sessions", { keyPath: "id" });
  crisis.createIndex("by-startAt", "startAt");
}

function upgradeV2(db: IDBPDatabase<SobrietyDBSchema>) {
  db.createObjectStore("app_meta", { keyPath: "key" });
}

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<SobrietyDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) upgradeV1(db);
        if (oldVersion < 2) upgradeV2(db);
      },
    });
  }
  return dbPromise;
}