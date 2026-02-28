declare module "node:sqlite" {
  export class StatementSync {
    run(...params: unknown[]): { lastInsertRowid: bigint | number; changes: number };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    transaction<T extends (...args: never[]) => unknown>(fn: T): T;
  }
}
