/**
 * Collaboration Storage Interface for Building Cost Building System
 * 
 * This module provides database interactions for collaboration features such as
 * comments, shared projects, and collaborative editing.
 */
import { db } from "../db";
import { 
  InsertComment, 
  Comment, 
  comments,
  InsertSharedProject,
  SharedProject,
  sharedProjects,
  InsertProjectMember,
  ProjectMember,
  projectMembers,
  InsertProjectItem,
  ProjectItem,
  projectItems,
  users
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Comments related functions
export async function getCommentsByTarget(targetType: string, targetId: number): Promise<Comment[]> {
  return db.select().from(comments)
    .where(and(
      eq(comments.targetType, targetType),
      eq(comments.targetId, targetId)
    ))
    .orderBy(comments.createdAt);
}

export async function getComment(id: number): Promise<Comment | undefined> {
  const results = await db.select().from(comments).where(eq(comments.id, id));
  return results[0];
}

export async function createComment(comment: InsertComment): Promise<Comment> {
  const results = await db.insert(comments).values(comment).returning();
  return results[0];
}

export async function updateComment(id: number, data: Partial<Comment>): Promise<Comment | undefined> {
  const results = await db.update(comments)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(comments.id, id))
    .returning();
  return results[0];
}

export async function deleteComment(id: number): Promise<void> {
  await db.delete(comments).where(eq(comments.id, id));
}

// Shared Projects related functions
export async function getProjectsByUser(userId: number): Promise<(SharedProject & { role: string })[]> {
  // Join projects with members to get projects where user is a member
  const results = await db.select({
    id: sharedProjects.id,
    name: sharedProjects.name,
    description: sharedProjects.description,
    createdById: sharedProjects.createdById,
    createdAt: sharedProjects.createdAt,
    updatedAt: sharedProjects.updatedAt,
    status: sharedProjects.status,
    isPublic: sharedProjects.isPublic,
    role: projectMembers.role
  })
  .from(sharedProjects)
  .innerJoin(
    projectMembers,
    and(
      eq(sharedProjects.id, projectMembers.projectId),
      eq(projectMembers.userId, userId)
    )
  );
  
  return results;
}

export async function getProject(id: number): Promise<SharedProject | undefined> {
  const results = await db.select().from(sharedProjects).where(eq(sharedProjects.id, id));
  return results[0];
}

export async function createProject(project: InsertSharedProject): Promise<SharedProject> {
  const results = await db.insert(sharedProjects).values(project).returning();
  return results[0];
}

export async function updateProject(id: number, data: Partial<SharedProject>): Promise<SharedProject | undefined> {
  const results = await db.update(sharedProjects)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(sharedProjects.id, id))
    .returning();
  return results[0];
}

export async function deleteProject(id: number): Promise<void> {
  // Delete all members first (foreign key constraint)
  await db.delete(projectMembers).where(eq(projectMembers.projectId, id));
  
  // Delete all items (foreign key constraint)
  await db.delete(projectItems).where(eq(projectItems.projectId, id));
  
  // Delete the project
  await db.delete(sharedProjects).where(eq(sharedProjects.id, id));
}

// Project Members related functions
export async function getProjectMembers(projectId: number): Promise<(ProjectMember & { username?: string })[]> {
  // Join with users to get usernames
  const results = await db.select({
    id: projectMembers.id,
    projectId: projectMembers.projectId,
    userId: projectMembers.userId,
    role: projectMembers.role,
    joinedAt: projectMembers.joinedAt,
    invitedBy: projectMembers.invitedBy,
    username: users.username
  })
  .from(projectMembers)
  .leftJoin(users, eq(projectMembers.userId, users.id))
  .where(eq(projectMembers.projectId, projectId));
  
  return results;
}

export async function getProjectMember(projectId: number, userId: number): Promise<ProjectMember | undefined> {
  const results = await db.select().from(projectMembers)
    .where(and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.userId, userId)
    ));
  return results[0];
}

export async function isProjectMember(projectId: number, userId: number): Promise<boolean> {
  const member = await getProjectMember(projectId, userId);
  return !!member;
}

export async function getProjectMemberRole(projectId: number, userId: number): Promise<string | null> {
  const member = await getProjectMember(projectId, userId);
  return member ? member.role : null;
}

export async function addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
  const results = await db.insert(projectMembers).values(member).returning();
  return results[0];
}

export async function updateProjectMember(
  projectId: number, 
  userId: number, 
  data: Partial<ProjectMember>
): Promise<ProjectMember | undefined> {
  const results = await db.update(projectMembers)
    .set(data)
    .where(and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.userId, userId)
    ))
    .returning();
  return results[0];
}

export async function removeProjectMember(projectId: number, userId: number): Promise<void> {
  await db.delete(projectMembers)
    .where(and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.userId, userId)
    ));
}

// Project Items related functions
export async function getProjectItems(projectId: number): Promise<ProjectItem[]> {
  return db.select().from(projectItems).where(eq(projectItems.projectId, projectId));
}

export async function getProjectItem(
  projectId: number, 
  itemType: string, 
  itemId: number
): Promise<ProjectItem | undefined> {
  const results = await db.select().from(projectItems)
    .where(and(
      eq(projectItems.projectId, projectId),
      eq(projectItems.itemType, itemType),
      eq(projectItems.itemId, itemId)
    ));
  return results[0];
}

export async function addProjectItem(item: InsertProjectItem): Promise<ProjectItem> {
  const results = await db.insert(projectItems).values(item).returning();
  return results[0];
}

export async function removeProjectItem(projectId: number, itemType: string, itemId: number): Promise<void> {
  await db.delete(projectItems)
    .where(and(
      eq(projectItems.projectId, projectId),
      eq(projectItems.itemType, itemType),
      eq(projectItems.itemId, itemId)
    ));
}