import {
  dispatchAsync,
  encode,
  ObjectId,
  UpdateResult,
  decode,
  dispatch,
} from "https://deno.land/x/mongo@v0.8.0/mod.ts";
import {
  CommandType,
  FindOptions,
} from "https://deno.land/x/mongo@v0.8.0/ts/types.ts";
import {
  convert,
  parse,
} from "https://deno.land/x/mongo@v0.8.0/ts/type_convert.ts";

export interface ClientOptions {
  /**
   * The initial list of seeds that the Client should connect to.
   * Note that by default, the driver will autodiscover other nodes in the cluster.
   * To connect directly to a single server (rather than autodiscovering the rest of the cluster),
   * set the direct field to `true.
   */
  hosts: string[];

  /**
   * The application name that the Client will send to the server as part of the handshake.
   * This can be used in combination with the server logs to determine which Client is connected to a server.
   */
  appName?: string;

  /**
   * The connect timeout passed to each underlying TcpStream when attemtping to connect to the server.
   * The default value is 10 seconds.
   */
  connectTimeout?: number;

  /**
   * The username to authenticate with. This applies to all mechanisms but may be omitted when authenticating via MONGODB-X509.
   */
  username?: string;

  /**
   * The password to authenticate with. This does not apply to all mechanisms.
   */
  password?: string;

  /**
   * Specifies whether the Client should directly connect to a single host rather than autodiscover all servers in the cluster.
   * The default value is false.
   */
  directConnection?: boolean;

  /**
   * The amount of time each monitoring thread should wait between sending an isMaster command to its respective server.
   * The default value is 10 seconds.
   */
  heartbeatFreq?: number;

  /**
   * The amount of time that a connection can remain idle in a connection pool before being closed.
   * A value of zero indicates that connections should not be closed due to being idle.
   * By default, connections will not be closed due to being idle.
   */
  maxIdleTime?: number;

  /**
   * The maximum amount of connections that the Client should allow to be created in a connection pool for a given server.
   * If an operation is attempted on a server while max_pool_size connections are checked out,
   * the operation will block until an in-progress operation finishes and its connection is checked back into the pool.The default value is 100.
   */
  maxPoolSize?: number;

  /**
   * The minimum number of connections that should be available in a server's connection pool at a given time.
   * If fewer than min_pool_size connections are in the pool,
   * connections will be added to the pool in the background until min_pool_size is reached.
   * The default value is 0.
   */
  minPoolSize?: number;

  /**
   * The name of the replica set that the Client should connect to.
   */
  replSetName?: string;

  /**
   * The amount of time the Client should attempt to select a server for an operation before timing outs The default value is 30 seconds.
   */
  serverSelectionTimeout?: number;

  /**
   * The amount of time a thread should block while waiting to check out a connection before returning an error.
   * Note that if there are fewer than max_pool_size connections checked out or if a connection is available in the pool,
   * checking out a connection will not block.
   * By default, threads will wait indefinitely for a connection to become available.
   */
  waitQueueTimeout?: number;
}

export class MongoClient {
  private _clientId: number = 0;

  get clientId() {
    return this._clientId;
  }

  connectWithUri(uri: string) {
    const data = dispatch(
      { command_type: CommandType.ConnectWithUri },
      encode(uri),
    );
    this._clientId = parseInt(decode(data));
  }

  connectWithOptions(options: ClientOptions) {
    const data = dispatch(
      { command_type: CommandType.ConnectWithOptions },
      encode(JSON.stringify(options)),
    );
    this._clientId = parseInt(decode(data));
  }

  async listDatabases(): Promise<string[]> {
    return (await dispatchAsync({
      command_type: CommandType.ListDatabases,
      client_id: this._clientId,
    })) as string[];
  }

  database(name: string): Database {
    return new Database(this, name);
  }
}

export class Database {
  constructor(private client: MongoClient, private name: string) {}

  async listCollectionNames(): Promise<string[]> {
    const names = await dispatchAsync(
      {
        command_type: CommandType.ListCollectionNames,
        client_id: this.client.clientId,
      },
      encode(this.name),
    );
    return names as string[];
  }

  collection<T extends {}>(name: string): Collection<T> {
    return new Collection<T>(this.client, this.name, name);
  }
}

export class Collection<T extends {}> {
  constructor(
    private readonly client: MongoClient,
    private readonly dbName: string,
    private readonly collectionName: string,
  ) {}

  private async _find(filter?: Partial<T>, options?: FindOptions): Promise<T> {
    const doc = await dispatchAsync(
      {
        command_type: CommandType.Find,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          filter,
          ...options,
        }),
      ),
    );
    return doc as T;
  }

  public async count(filter?: Partial<T>): Promise<number> {
    const count = await dispatchAsync(
      {
        command_type: CommandType.Count,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          filter,
        }),
      ),
    );
    return count as number;
  }

  public async findOne(filter?: Partial<T>): Promise<T> {
    return parse(await this._find(filter, { findOne: true }));
  }

  public async find(filter?: Partial<T>, options?: FindOptions): Promise<T[]> {
    return parse(await this._find(filter, { findOne: false, ...options }));
  }

  public async insertOne(doc: T): Promise<ObjectId> {
    const _id = await dispatchAsync(
      {
        command_type: CommandType.InsertOne,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          doc: convert(doc),
        }),
      ),
    );
    return _id as ObjectId;
  }

  public async insertMany(docs: T[]): Promise<ObjectId[]> {
    const _ids = await dispatchAsync(
      {
        command_type: CommandType.InsertMany,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          docs: convert(docs),
        }),
      ),
    );
    return _ids as ObjectId[];
  }

  private async _delete(
    query: Partial<T>,
    deleteOne: boolean = false,
  ): Promise<number> {
    const deleteCount = await dispatchAsync(
      {
        command_type: CommandType.Delete,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          query,
          deleteOne,
        }),
      ),
    );
    return deleteCount as number;
  }

  public deleteOne(query: Partial<T>): Promise<number> {
    return this._delete(query, true);
  }

  public deleteMany(query: Partial<T>): Promise<number> {
    return this._delete(query, false);
  }

  private async _update(
    query: Partial<T>,
    update: Partial<T>,
    updateOne: boolean = false,
  ): Promise<UpdateResult & T> {
    const result = await dispatchAsync(
      {
        command_type: CommandType.Update,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          query: convert(query),
          update: convert(update),
          updateOne,
        }),
      ),
    );
    return result as UpdateResult & T;
  }

  public updateOne(
    query: Partial<T>,
    update: Partial<T>,
  ): Promise<UpdateResult & T> {
    return this._update(query, update, true);
  }

  public updateMany(
    query: Partial<T>,
    update: Partial<T>,
  ): Promise<UpdateResult & T> {
    return this._update(query, update, false);
  }

  public async aggregate<T = any>(pipeline: Object[]): Promise<T[]> {
    const docs = await dispatchAsync(
      {
        command_type: CommandType.Aggregate,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          pipeline,
        }),
      ),
    );
    return parse(docs) as T[];
  }

  public async createIndexes(
    models: {
      keys: Object;
      options?: {
        background?: boolean;
        unique?: boolean;
        name?: string;
        partialFilterExpression?: Object;
        sparse?: boolean;
        expireAfterSeconds?: number;
        storageEngine?: Object;
      };
    }[],
  ): Promise<string[]> {
    const docs = await dispatchAsync(
      {
        command_type: CommandType.CreateIndexes,
        client_id: this.client.clientId,
      },
      encode(
        JSON.stringify({
          dbName: this.dbName,
          collectionName: this.collectionName,
          models,
        }),
      ),
    );
    return docs as string[];
  }
}
