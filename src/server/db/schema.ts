import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  index,
  varchar,
  json
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const fotowinnowTable = (name: string) => `fotowinnow_${name}`;

// Photographers table to normalize photographer data and sync with Clerk
export const photographers = pgTable(
  fotowinnowTable("photographer"),
  {
    id: serial("id").primaryKey(),
    clerkId: varchar("clerk_id", { length: 191 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull(),
    name: text("name").notNull(),
    tier: varchar("tier", { length: 50 }).default("free").notNull(),
    metadata: json("metadata"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("photographer_clerk_id_idx").on(t.clerkId),
    index("photographer_email_idx").on(t.email),
    index("photographer_name_idx").on(t.name),
  ],
);

// Albums table
export const albums = pgTable(
  fotowinnowTable("album"),
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    coverImage: text("cover_image").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    isShared: boolean("is_shared").default(false).notNull(),
    photographerId: integer("photographer_id")
      .references(() => photographers.id)
      .notNull(),
  },
  (t) => [
    index("album_title_idx").on(t.title),
    index("album_photographer_idx").on(t.photographerId),
  ],
);

// Images table
export const images = pgTable(
  fotowinnowTable("image"),
  {
    id: serial("id").primaryKey(),
    albumId: integer("album_id").references(() => albums.id).notNull(),
    url: text("url").notNull(),
    optimizedUrl: text("optimized_url").notNull(),
    watermarkedUrl: text("watermarked_url").notNull(),
    caption: text("caption"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
  },
  (t) => [
    index("image_album_idx").on(t.albumId),
  ],
);

// Comments table
export const comments = pgTable(
  fotowinnowTable("comment"),
  {
    id: serial("id").primaryKey(),
    imageId: integer("image_id").references(() => images.id).notNull(),
    text: text("text").notNull(),
    author: text("author").notNull(), // In a real app, this would reference a users table
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
  },
  (t) => [
    index("comment_image_idx").on(t.imageId),
  ],
);
