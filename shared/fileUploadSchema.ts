/**
 * File Upload Schema
 * 
 * This file defines the schema for file uploads in the BCBS application.
 */

import { pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// File Uploads Table
export const fileUploads = pgTable('file_uploads', {
  id: serial('id').primaryKey(),
  fileId: uuid('file_id').defaultRandom().notNull().unique(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: text('file_size').notNull(),
  uploadedBy: uuid('uploaded_by'),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  associatedEntity: text('associated_entity'),
  associatedEntityId: text('associated_entity_id'),
  isPublic: text('is_public').default('false'),
  description: text('description'),
});

// Insert schema for file uploads
export const insertFileUploadSchema = createInsertSchema(fileUploads)
  .omit({ id: true, uploadedAt: true });

// Type definitions
export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;