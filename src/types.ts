export type UserRole = "admin" | "member";
export type UserStatus = "active" | "pending";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  specialty: string;
  workload?: number; // percentage of load
  createdAt: string;
  overallRating?: number; // monthly overall rating 1-5 or direct score
}

export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "progress" | "review" | "done" | "rejected";

export interface Task {
  id: string;
  title: string;
  assigneeId: string;
  campaignId: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  
  // Timer features
  timerDuration: number; // in seconds, e.g. 3600 for 1 hour
  timerRemaining: number; // in seconds
  timerIsRunning: boolean;
  timerStartedAt?: string; // ISO string when last started
  
  // Weights and evaluation
  weight: number; // Task weight (e.g. points: 5, 10, 20)
  starsRating?: number; // 1-5 evaluation stars
  evaluatedAt?: string;
}

export interface TaskAttachment {
  name: string;
  url: string;
  type: "image" | "file";
}

export interface TaskReport {
  id: string;
  taskId: string;
  taskTitle: string;
  memberId: string;
  memberName: string;
  summary: string;
  attachments: TaskAttachment[];
  createdAt: string;
  
  // Admin review flow
  status: "pending" | "approved" | "rejected";
  adminFeedback?: string;
  starsAwarded?: number;
  reviewedAt?: string;
  
  // Rejection explanation from member
  rejectionExplanation?: string;
  rejectionAttachments?: TaskAttachment[];
  rejectionCommentedAt?: string;
}

export interface Campaign {
  id: string;
  name: string;
  channel: string;
  budget: number;
  spent: number;
  progress: number;
  leads: number;
}

export interface Specialty {
  id: string;
  name: string;
  description: string;
}

export interface CRMNotification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: "tasks" | "team" | "review" | "rating";
  read: boolean;
  createdAt: string;
}
