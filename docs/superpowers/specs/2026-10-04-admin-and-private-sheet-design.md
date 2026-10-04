# Admin Dashboard and Private Google Sheet Design

**Status:** Proposed for review  
**Date:** 2026-10-04  
**Scope:** Improve all existing admin screens and add a private, one-way D1-to-Google-Sheets view.

## Goal

Make routine church-site administration easier for staff to understand, review, update, and delete. Provide a spreadsheet view that is simple to sort, filter, and share manually with approved church staff, while keeping the live site backed by Cloudflare D1.

## Existing application

The Cloudflare Worker serves the public Vite/React site and an authenticated admin API backed by D1. The admin currently has six sections: Events, Departments, Testimonies, Requests (Connect Cards and Meeting Requests), Giving Accounts, and Church Details. Access is guarded by Cloudflare Access and a Worker-side email allow list. Individual records can already be edited or deleted in some sections; testimonies can be approved or removed; visitor requests can be searched, sorted, reviewed, and deleted. The admin opens directly to Events and has no overview page.

The data includes private visitor names, email addresses, phone numbers, prayer requests, meeting details, and testimony submissions. A Google Sheet containing those records must remain private and be shared by the church only with people who should see them.

## Proposed admin experience

- Add an overview screen as the landing page, with counts for upcoming events, departments, testimonies awaiting review, connect cards, meeting requests, and giving categories. Counts link to their corresponding section.
- Keep the six existing sections and their current capabilities. Make navigation consistent on desktop and mobile, with clear active state and readable screen titles.
- Standardize each list with loading, empty, error, and success feedback; search and sort where useful; show key details in the list and the full record in a focused detail view where text is long.
- Keep per-record edits, testimony approval, and deletions explicit. Confirm destructive actions and refresh the affected view after success. Do not add a bulk-delete control in this phase.
- Replace the raw JSON service-times editor with ordinary day, service-name, and start/end time fields so staff can update the schedule without editing JSON.
- Add a clearly labeled **Sync to private Google Sheet** action with last-sync time and a visible failure message. The action is available only inside the Access-protected admin.

## Data flow and ownership

Cloudflare D1 remains the sole source of truth for website content and submissions. The Worker reads a consistent snapshot from D1 and writes it into named tabs in a Google Sheet when an authorized administrator requests a sync. The Sheet is a reporting and sharing view, not a second database.

Each sync replaces the Sheet's managed tab contents with the current D1 values, preserving stable tab names and headers. After staff delete or update a record in the admin, a subsequent sync reflects that change. Editing or deleting cells directly in the Sheet does not change the website and will be overwritten on the next sync. The UI must state this plainly.

The Sheet tabs are: Overview, Church Details, Service Times, Events, Departments, Testimonies, Connect Cards, Meeting Requests, and Giving Accounts. Columns should use plain headers, ISO timestamps/dates where applicable, and separate fields instead of packing content into long JSON strings. Private request tabs include the personal information necessary for church follow-up; they are not public data.

## Google authorization and privacy

The spreadsheet is created in the connected Google Drive account selected for church use and stays private by default. Do not enable “anyone with the link” sharing or invite recipients automatically. The church can grant access later through Drive's normal share controls.

The Worker needs Google Sheets API write access. Store the Google service-account credentials and spreadsheet ID only as Cloudflare Worker secrets, never in Vite variables, browser code, the repository, logs, or the Sheet itself. Grant the service account access only to this spreadsheet. Keep the Cloudflare Access requirement on both the admin page and admin API. Sync failures must not expose tokens, private row content, or raw provider errors to the browser.

Creating the sheet alone will not connect the deployed Worker. Connection requires a service account with Sheets API access, sharing the private sheet with that service-account identity, and adding the credentials and spreadsheet ID as Worker secrets. These are documented setup steps; do not make the sheet public to avoid them.

## Errors and consistency

- A D1 edit/delete succeeds or fails independently of Google Sheets. If a following Sheet sync fails, show that the database change succeeded but the Sheet is stale and offer a retry.
- Sync uses bounded reads and the Google Sheets batch update API; it must not run on every visitor request or background cron.
- Sync should be safe to repeat. Use stable tab identifiers, clear managed data rows before writing the latest snapshot, and report the completion time only after all tabs are updated successfully.
- If partial tab writes cannot be made atomic with the available API, keep a sync-in-progress state and expose the last successful completion time; document that partial data may appear until retry.
- Do not log request bodies, service-account keys, account numbers, or prayer/meeting text.

## Alternatives considered

1. **Manual CSV export:** simplest and needs no Google credentials, but each export becomes a stale, detached snapshot and is not a connected Sheet.
2. **Private one-way D1-to-Sheets sync (recommended):** supports easy viewing and sorting while keeping one source of truth. It requires one-time Google service-account setup. Deletes remain controlled by the admin dashboard.
3. **Two-way Sheets editing:** edits and deletions in Sheets affect the live site. This creates conflict, authorization, accidental-deletion, and audit problems, so it is excluded from this first release.

## Delivery and verification

1. Review this design and approve it before creating an implementation plan.
2. Plan the admin usability changes and private-sheet sync as separate implementation milestones in the same feature branch.
3. Create a private spreadsheet with the named tabs and readable headers in the church Google Drive.
4. Implement and verify admin flows using local/test data, including empty and populated screens, delete confirmations, and service-time editing.
5. Verify the sync against the private sheet with non-sensitive sample data before adding production records.
6. Configure secrets and run one authorized production sync only after the user supplies/sets up the Google service-account credentials and confirms the destination sheet.
7. Check each tab, record counts, timestamps, and privacy settings. Keep the previous live site/data unchanged during rollout.

## Approval boundary

This document is a design proposal, not implementation authorization. It proposes a private, manually triggered one-way mirror, with deletion performed in the admin dashboard. Two-way changes from Sheets are out of scope. After approval of this document, prepare a separate written implementation plan for review before code changes.
