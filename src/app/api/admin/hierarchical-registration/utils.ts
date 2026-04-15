// Stub utils for hierarchical registration API routes
// TODO: Implement these functions properly

import { NextResponse } from "next/server";

export function successResponse(data: any, message?: string) {
  return NextResponse.json({ success: true, data, message });
}

export function errorResponse(error: string, status: number = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function getUserProfile(userId: string) {
  return null;
}

export async function createServiceClient() {
  return null;
}

export async function logApprovalHistory(
  entityType: string,
  entityId: string,
  action: string,
  approvedBy: string,
) {
  return null;
}

export async function sendNotificationEmail(
  email: string,
  subject: string,
  content: string,
) {
  return null;
}
