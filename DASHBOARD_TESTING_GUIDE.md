# Role-Based Dashboard Testing Guide

## Overview

This comprehensive testing guide covers all 5 role-based dashboards in the TSEDK application with detailed test accounts, workflows, and validation checklist.

---

## Test Accounts

### Account 1: System Admin

- **Email:** admin@tsedk.test
- **Password:** TestPass123!
- **Role:** `system_admin`
- **Access:** System Admin Dashboard (/dashboard/admin)
- **Capabilities:**
  - View all Teklay (Regional) registrations
  - Approve/Reject Teklay registrations
  - View system-wide statistics (total churches, members)
  - View system activity timeline

### Account 2: Teklay Admin (Regional Admin)

- **Email:** teklay@tsedk.test
- **Password:** TestPass123!
- **Role:** `teklay_bete_khnet`
- **Access:** Teklay Admin Dashboard (/dashboard/teklay-bete-khnet)
- **Capabilities:**
  - View Hagere (District) registrations under their region
  - Approve/Reject Hagere registrations
  - Register new Hagere administrators
  - View regional activity timeline

### Account 3: Hagere Admin (District Admin)

- **Email:** hagere@tsedk.test
- **Password:** TestPass123!
- **Role:** `hagere_sebket`
- **Access:** Hagere Admin Dashboard (/dashboard/hagere-sebket)
- **Capabilities:**
  - View Church registrations under their district
  - Approve/Reject Church registrations
  - Register new Churches
  - View district activity timeline

### Account 4: Church Admin

- **Email:** church@tsedk.test
- **Password:** TestPass123!
- **Role:** `church_admin`
- **Access:** Church Admin Dashboard (/dashboard/church-admin)
- **Capabilities:**
  - View Member registrations for their church
  - Approve/Reject member registrations
  - View member activity and status
  - View church-level statistics

### Account 5: Member

- **Email:** member@tsedk.test
- **Password:** TestPass123!
- **Role:** (no special role - member)
- **Access:** Member Dashboard (/dashboard/member)
- **Capabilities:**
  - View personal registration status
  - See approval/rejection reasons
  - Resubmit application if rejected
  - View personal activity timeline

### Account 6: Treasurer (Optional)

- **Email:** treasurer@tsedk.test
- **Password:** TestPass123!
- **Role:** `treasurer`
- **Access:** Treasurer Dashboard (future implementation)
- **Capabilities:**
  - View financial reports
  - Manage donations and contributions

---

## Testing Workflows

### Workflow 1: Complete Approval Chain (Happy Path)

#### Step 1: System Admin Approves Teklay

1. Log in as System Admin (admin@tsedk.test)
2. Navigate to /dashboard/admin
3. See "Regional Administrations" table with pending Teklay registrations
4. Click "View" to preview documents (letterOfInstitution, regionalApprovalCertificate)
5. Click checkmark icon to approve
6. System should show success toast: "Teklay approved successfully"
7. Activity timeline updates with approval event

#### Step 2: Teklay Admin Approves Hagere

1. Log out and sign in as Teklay Admin (teklay@tsedk.test)
2. Navigate to /dashboard/teklay-bete-khnet
3. See "Hagere Registrations" table with pending entries
4. Verify statistics updated (pending count decreased)
5. Click "View" to preview Hagere documents
6. Click checkmark to approve
7. Toast confirms: "Hagere approved successfully"

#### Step 3: Hagere Admin Approves Church

1. Log out and sign in as Hagere Admin (hagere@tsedk.test)
2. Navigate to /dashboard/hagere-sebket
3. See "Church Registrations" table
4. Approve a church registration
5. Toast: "Church approved successfully"
6. Activity timeline shows new approval event

#### Step 4: Church Admin Approves Member

1. Log out and sign in as Church Admin (church@tsedk.test)
2. Navigate to /dashboard/church-admin
3. See "Member Approvals" table with pending members
4. View member documents (idFront, idBack, selfie)
5. Approve member registration
6. Toast: "Member approved successfully"

#### Step 5: Member Sees Approval

1. Log out and sign in as Member (member@tsedk.test)
2. Navigate to /dashboard/member
3. See status badge: "Approved"
4. See approval date and full profile
5. Activity timeline shows approval event
6. "Documents Complete" and "Active" status cards visible

---

### Workflow 2: Rejection with Resubmit

#### Step 1: Church Admin Rejects Member

1. Log in as Church Admin (church@tsedk.test)
2. Navigate to Church Admin Dashboard
3. Click X icon on a pending member
4. Modal opens: "Approve or Reject Member: [Name]"
5. Select "Reject" (red button)
6. Enter rejection reason: "Document quality insufficient"
7. Click "Reject Member"
8. Toast: "Member rejected"
9. Activity timeline updated

#### Step 2: Member Sees Rejection and Resubmits

1. Log out and sign in as Member (member@tsedk.test)
2. Navigate to Member Dashboard
3. Status shows: "Rejected" (red badge)
4. See rejection reason: "Document quality insufficient"
5. Click "Resubmit Application" button
6. Form opens (or redirects to registration form)
7. Update documents with improved versions
8. Resubmit

#### Step 3: Church Admin Reviews Resubmission

1. Log back in as Church Admin
2. Navigate to Dashboard
3. See member appears again in "Pending Approvals"
4. Note submission shows "resubmitted" in activity
5. Review new documents
6. Approve the resubmission

---

### Workflow 3: Search and Filter Functionality

#### Test Search

1. Log in as Church Admin
2. Go to Church Admin Dashboard
3. In "Member Approvals" table, search box at top
4. Type member name - table filters in real-time
5. Type member email - table filters correctly
6. Clear search - shows all records again

#### Test Status Filters

1. Click "approved" button in filter bar
2. Table shows only approved members (green badges)
3. Click "rejected" button
4. Table shows only rejected members (red badges)
5. Click "pending" button
6. Table shows only pending members (yellow badges)
7. Click "all" button
8. Table shows all records regardless of status

#### Test Pagination

1. In Member Approvals table, note pagination controls
2. See "Showing 1 to 10 of X items"
3. Click next page arrow
4. Page increments, new items display
5. Click previous page arrow
6. Return to first page
7. Change "10 per page" dropdown to "25 per page"
8. More items display on single page
9. Select "50 per page"
10. Even more items visible

---

### Workflow 4: Document Preview Modal

#### Test Document Viewing

1. Log in as Church Admin
2. Click eye icon on any member in table
3. DocumentPreviewModal opens fullscreen
4. Default shows "ID Front" document image/PDF
5. Navigation buttons below: prev/next arrows
6. Documents rotate: ID Front → ID Back → Selfie → loops
7. Click zoom-in button: document magnifies to 150%
8. Click zoom-out button: shrinks back to 100%
9. Click fullscreen icon: modal expands (already fullscreen, simulates behavior)
10. Click outside modal or close button (X): modal closes

#### Test with Missing Documents

1. Find member with only partial documents
2. Open preview modal
3. Attempt to navigate to missing document type
4. System gracefully handles (shows placeholder or skips)
5. No errors in console

---

### Workflow 5: Authorization & Role-Based Access

#### Test: Non-Authorized User Access

1. Log in as Member (member@tsedk.test)
2. Manually navigate to /dashboard/admin
3. Should redirect to /dashboard/member (their dashboard)
4. No error shown, just silent redirect

5. Go to /dashboard/church-admin while logged in as Member
6. Should redirect to Member dashboard
7. Authorization check passes

#### Test: Admin Access Non-Admin Dashboards

1. Log in as System Admin
2. Manually navigate to /dashboard/member
3. Should redirect to /dashboard/admin (admin dashboard)
4. Admin role check working

#### Test: Session Token Usage

1. Open browser console (F12)
2. Log in as any non-admin user
3. Go to Church Admin Dashboard (manually navigate)
4. Check Network tab in DevTools
5. Verify API calls include `Authorization: Bearer {token}` header
6. Token should come from `session?.access_token` (not localStorage)

---

### Workflow 6: Empty States & Graceful Degradation

#### Test: Empty Member List

1. Log in as Church Admin for church with no members
2. Navigate to Church Admin Dashboard
3. Instead of empty table, see EmptyState component:
   - Icon: Users symbol
   - Title: "No Members"
   - Description: "No member registrations to review yet"

#### Test: No Activity

1. Access Member Dashboard
2. If no activity events exist yet
3. ActivityTimeline shows: "No recent activity" with clock icon

#### Test: Network Error Handling

1. Open DevTools Network tab
2. Set throttling to "Offline"
3. Navigate to any dashboard
4. Components should show loading skeleton or gracefully handle
5. Re-enable network - data loads

---

### Workflow 7: Stats Card Display & Trends

#### Test: Stats Card Rendering

1. Log in as Church Admin
2. View Dashboard - top shows 4 stat cards:
   - Total Members (blue)
   - Pending Approvals (yellow with up trend if > 0)
   - Approved (green)
   - Rejected (red)

#### Test: Stat Updates

1. Approve a member from the table
2. Refresh dashboard
3. "Pending Approvals" count decreases
4. "Approved" count increases
5. Statistics are cache-invalidated and re-fetched

---

### Workflow 8: Activity Timeline

#### Test: Timeline Display

1. Open Church Admin Dashboard
2. See "Recent Activity" section on right side
3. Shows timeline events with:
   - Colored icons (green checkmark, red X, etc.)
   - Event title
   - Time ago (e.g., "2 hours ago")
   - Actor name
   - Metadata if available (reason for rejection, etc.)

#### Test: Timeline Sorting

1. Activity should be sorted newest-first
2. Most recent event at top
3. Oldest at bottom

---

## Validation Checklist

### Component Functionality

- [ ] StatsCard displays correctly with icon, label, value, color
- [ ] StatsCard shows loading skeleton when data is fetching
- [ ] EmptyState displays with icon, title, description, optional CTA
- [ ] DocumentPreviewModal opens/closes correctly
- [ ] Document zoom in/out works
- [ ] Document navigation (prev/next) works
- [ ] ApprovalActionModal shows approve button for pending items
- [ ] ApprovalActionModal shows approve + reject for pending items
- [ ] ApprovalActionModal requires reason when rejecting
- [ ] ApprovalTable filters by status (all/pending/approved/rejected)
- [ ] ApprovalTable search works for name and email
- [ ] ApprovalTable pagination works (prev/next, per-page dropdown)
- [ ] ActivityTimeline displays events with correct icons and colors
- [ ] ActivityTimeline shows "no activity" message when empty

### Dashboard Pages

- [ ] System Admin Dashboard loads and displays correctly
- [ ] Teklay Admin Dashboard loads and displays correctly
- [ ] Hagere Admin Dashboard loads and displays correctly
- [ ] Church Admin Dashboard loads and displays correctly
- [ ] Member Dashboard loads and displays correctly
- [ ] All dashboards show correct user role/name

### API Integration

- [ ] Member fetch endpoint works (GET /api/church-admin/members)
- [ ] Member approve endpoint works (POST /api/church-admin/members/[id]/approve)
- [ ] Member reject endpoint works (POST /api/church-admin/members/[id]/reject)
- [ ] Member activity endpoint works (GET /api/church-admin/activity)
- [ ] Church fetch endpoint works (GET /api/hagere-admin/churches)
- [ ] Church approve endpoint works (POST /api/hagere-admin/churches/[id]/approve)
- [ ] Church reject endpoint works (POST /api/hagere-admin/churches/[id]/reject)
- [ ] Hagere fetch endpoint works (GET /api/teklay-admin/hageres)
- [ ] Teklay fetch endpoint works (GET /api/admin/teklays)
- [ ] System stats endpoint works (GET /api/admin/system-stats)
- [ ] All endpoints check authorization correctly
- [ ] All endpoints return 403 for unauthorized requests
- [ ] All endpoints log activity correctly

### Authorization & Security

- [ ] Non-admins cannot access /dashboard/admin
- [ ] Members cannot access /dashboard/church-admin
- [ ] Unauthorized users cannot call admin API endpoints
- [ ] Rejection reasons stored securely
- [ ] All API requests include Bearer token in Authorization header
- [ ] Session tokens from auth hook, not localStorage

### UI/UX

- [ ] All buttons have hover states
- [ ] Loading spinners appear during data fetching
- [ ] Success toasts appear for actions
- [ ] Error toasts appear for failed actions
- [ ] Modal closes on background click or X button
- [ ] Responsive on desktop, tablet, mobile devices
- [ ] Color scheme follows amber/gold theme
- [ ] Typography is consistent and readable

### Data & State Management

- [ ] Query cache invalidates after approval/rejection
- [ ] Dashboard auto-refreshes after actions
- [ ] Changes visible immediately without manual refresh
- [ ] No stale data shown
- [ ] Concurrent api calls handled correctly

---

## Test Data SQL

Use this SQL to populate test data in Supabase:

```sql
-- Insert test users (pre-create in Supabase Auth first, then add profiles)
-- Replace UUIDs with actual user IDs from Supabase Auth

-- System Admin Profile
INSERT INTO profiles (id, user_id, full_name, email, role)
VALUES ('admin-uuid-here', 'admin-uuid-here', 'System Admin', 'admin@tsedk.test', 'system_admin');

-- Teklay Admin Profile
INSERT INTO profiles (id, user_id, full_name, email, role)
VALUES ('teklay-uuid-here', 'teklay-uuid-here', 'Teklay Admin', 'teklay@tsedk.test', 'teklay_bete_khnet');

-- Hagere Admin Profile
INSERT INTO profiles (id, user_id, full_name, email, role)
VALUES ('hagere-uuid-here', 'hagere-uuid-here', 'Hagere Admin', 'hagere@tsedk.test', 'hagere_sebket');

-- Church Admin Profile
INSERT INTO profiles (id, user_id, full_name, email, role, church_id)
VALUES ('church-uuid-here', 'church-uuid-here', 'Church Admin', 'church@tsedk.test', 'church_admin', 'church-uuid-1');

-- Member Profile
INSERT INTO profiles (id, user_id, full_name, email)
VALUES ('member-uuid-here', 'member-uuid-here', 'Test Member', 'member@tsedk.test');

-- Test Teklay Registration (pending)
INSERT INTO teklay_registrations (
  id, name, email, phone, leader_name, region,
  status, created_at, documents
)
VALUES (
  'teklay-reg-1', 'Addis Ababa Teklay', 'teklay1@example.com',
  '+251911234567', 'Abebe Teklay', 'Addis Ababa',
  'pending', now(),
  '{"letterOfInstitution": "https://example.com/doc1.pdf", "regionalApprovalCertificate": "https://example.com/doc2.pdf"}'
);

-- Test Hagere Registration (pending)
INSERT INTO hagere_registrations (
  id, name, email, phone, leader_name, district,
  teklay_id, status, created_at, documents
)
VALUES (
  'hagere-reg-1', 'Addis Ketema Hagere', 'hagere1@example.com',
  '+251912345678', 'Kidist Hagere', 'Addis Ketema',
  'teklay-1', 'pending', now(),
  '{"letterOfAuthorization": "https://example.com/doc3.pdf", "registrationCertificate": "https://example.com/doc4.pdf"}'
);

-- Test Church Registration (pending)
INSERT INTO church_registrations (
  id, name, email, phone, leader_name,
  hagere_id, status, created_at, documents
)
VALUES (
  'church-1', 'Holy Trinity Church', 'trinity@example.com',
  '+251913456789', 'Father Mikhael', 'hagere-1',
  'pending', now(),
  '{"letterOfIntroduction": "https://example.com/doc5.pdf", "churchCertificate": "https://example.com/doc6.pdf"}'
);

-- Test Member Registration (pending)
INSERT INTO member_registrations (
  id, user_id, church_id, name, email, phone,
  status, created_at, documents
)
VALUES (
  'member-1', 'member-uuid-here', 'church-1',
  'Test Member', 'member@tsedk.test', '+251914567890',
  'pending', now(),
  '{"idFront": "https://example.com/id-front.jpg", "idBack": "https://example.com/id-back.jpg", "selfie": "https://example.com/selfie.jpg"}'
);

-- Test Approved Entities (for viewing approved items)

-- Approved Teklay
INSERT INTO teklay_registrations (
  id, name, email, phone, leader_name, region,
  status, created_at, approved_at, approved_by, documents
)
VALUES (
  'teklay-approved-1', 'Oromia Teklay', 'teklay-oromia@example.com',
  '+251915678901', 'Jomo Teklay', 'Oromia',
  'approved', '2024-01-15', '2024-01-20', 'admin-uuid-here',
  '{"letterOfInstitution": "https://example.com/doc7.pdf", "regionalApprovalCertificate": "https://example.com/doc8.pdf"}'
);

-- Approved Hagere
INSERT INTO hagere_registrations (
  id, name, email, phone, leader_name, district,
  teklay_id, status, created_at, approved_at, approved_by, documents
)
VALUES (
  'hagere-approved-1', 'Oromia East Hagere', 'hagere-oromia@example.com',
  '+251916789012', 'Gemechu Hagere', 'East Oromia',
  'teklay-1', 'approved', '2024-01-16', '2024-01-21', 'teklay-uuid-here',
  '{"letterOfAuthorization": "https://example.com/doc9.pdf", "registrationCertificate": "https://example.com/doc10.pdf"}'
);

-- Approved Church
INSERT INTO church_registrations (
  id, name, email, phone, leader_name,
  hagere_id, status, created_at, approved_at, approved_by, documents
)
VALUES (
  'church-approved-1', 'Good Shepherd Church', 'shepherd@example.com',
  '+251917890123', 'Father Gabriel', 'hagere-1',
  'approved', '2024-01-17', '2024-01-22', 'hagere-uuid-here',
  '{"letterOfIntroduction": "https://example.com/doc11.pdf", "churchCertificate": "https://example.com/doc12.pdf"}'
);

-- Approved Member
INSERT INTO member_registrations (
  id, user_id, church_id, name, email, phone,
  status, created_at, approved_at, approved_by, documents
)
VALUES (
  'member-approved-1', 'different-member-uuid', 'church-1',
  'Approved Member', 'approved@example.com', '+251918901234',
  'approved', '2024-01-18', '2024-01-23', 'church-uuid-here',
  '{"idFront": "https://example.com/id-front-2.jpg", "idBack": "https://example.com/id-back-2.jpg", "selfie": "https://example.com/selfie-2.jpg"}'
);

-- Test Rejected Entities
INSERT INTO member_registrations (
  id, user_id, church_id, name, email, phone,
  status, rejection_reason, created_at, rejected_at, rejected_by, documents
)
VALUES (
  'member-rejected-1', 'rejected-member-uuid', 'church-1',
  'Rejected Member', 'rejected@example.com', '+251919012345',
  'rejected', 'Document quality insufficient - please provide clear photos',
  '2024-01-19', '2024-01-24', 'church-uuid-here',
  '{"idFront": "https://example.com/id-front-3.jpg", "idBack": "https://example.com/id-back-3.jpg", "selfie": "https://example.com/selfie-3.jpg"}'
);

-- Activity Log Entries
INSERT INTO activity_log (id, actor_id, action, target_id, target_type, created_at)
VALUES
  ('activity-1', 'church-uuid-here', 'member_approved', 'member-approved-1', 'member_registration', now() - interval '2 hours'),
  ('activity-2', 'hagere-uuid-here', 'church_approved', 'church-approved-1', 'church_registration', now() - interval '1 day'),
  ('activity-3', 'church-uuid-here', 'member_rejected', 'member-rejected-1', 'member_registration', '2024-01-24'),
  ('activity-4', 'church-uuid-here', 'member_submitted', 'member-1', 'member_registration', now());
```

---

## Notes for QA Team

1. **Image/PDF URLs:** Replace placeholder URLs with actual document URLs from your storage (Supabase Storage, CloudFront, etc.)
2. **UUIDs:** Replace `admin-uuid-here` etc. with actual user IDs from Supabase Auth
3. **Dates:** Adjust test dates as needed for realistic scenarios
4. **Roles & IDs:** Ensure `teklay_id`, `hagere_id`, `church_id` match between profiles and registrations tables
5. **RLS Policies:** Verify all RLS policies are configured to allow users to access only their own data
6. **Toast Notifications:** Test both success and error scenarios to verify toast messages appear

---

## Known Limitations & Future Enhancements

1. **Document Hosting:** Currently URLs are hardcoded. Should integrate with actual file upload/storage
2. **Email Notifications:** Email notifications on approval/rejection not yet implemented
3. **Bulk Actions:** Bulk approve/reject not implemented (can add multiple selection)
4. **Advanced Reporting:** Dashboard analytics and export features not yet available
5. **Multi-language:** i18n setup exists but dashboard text not yet translated
6. **Mobile Optimization:** Components responsive but could use mobile-specific UI adjustments
7. **Dark Mode:** No dark mode support yet (can add with Tailwind class strategy)

---

## Contact & Support

For issues or questions during testing:

- Check browser console (F12) for error details
- Check Supabase logs for database/auth issues
- Verify RLS policies allow your role to access data
- Ensure all API endpoints are deployed to correct environment
