import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  index
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const fotowinnowTable = (name: string) => `fotowinnow_${name}`;

// Photographers table to normalize photographer data
export const photographers = pgTable(
  fotowinnowTable("photographer"),
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("photographer_name_idx").on(t.name)],
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
    photographerId: integer("photographer_id").references(() => photographers.id),
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
