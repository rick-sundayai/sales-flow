# Database Schema Diagram

Visual representation of the CRM database structure.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION LAYER                         │
│                        (Managed by Supabase)                         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │
                         ┌─────────▼─────────┐
                         │   auth.users      │
                         │  (Supabase Core)  │
                         │                   │
                         │  • id (uuid)      │
                         │  • email          │
                         │  • created_at     │
                         └─────────┬─────────┘
                                   │
                                   │ 1:1
                                   │
                         ┌─────────▼──────────┐
                         │  user_profiles     │
                         │  (Your App Data)   │
                         │                    │
                         │  • id              │
                         │  • user_id (FK) ◄──┼── References auth.users
                         │  • email           │
                         │  • first_name      │
                         │  • last_name       │
                         │  • full_name       │
                         │  • avatar_url      │
                         └─────────┬──────────┘
                                   │
                                   │ user_id used in all tables below
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         │                         │                         │
┌────────▼─────────┐    ┌──────────▼──────────┐    ┌───────▼────────┐
│    clients       │    │   automations       │    │   activities   │
│                  │    │                     │    │   (orphans)    │
│  • id            │    │  • id               │    │                │
│  • user_id (FK)  │    │  • user_id (FK)     │    │  • id          │
│  • contact_name  │    │  • name             │    │  • user_id(FK) │
│  • email         │    │  • trigger_type     │    │  • type        │
│  • phone         │    │  • action_type      │    │  • title       │
│  • company_name  │    │  • n8n_webhook_url  │    │  • completed   │
│  • status        │    │  • is_active        │    └────────────────┘
│  • last_contact  │    │  • total_runs       │
└────────┬─────────┘    └─────────────────────┘
         │
         │ 1:N
         │
         ├────────────────────────────────────────────┐
         │                                            │
         │                                            │
┌────────▼─────────┐                         ┌───────▼────────┐
│     deals        │                         │   meetings     │
│                  │                         │                │
│  • id            │                         │  • id          │
│  • user_id (FK)  │                         │  • user_id(FK) │
│  • client_id(FK) │◄────────────────┐       │  • client_id   │
│  • title         │                 │       │    (FK)        │
│  • value         │                 │       │  • title       │
│  • stage         │                 │       │  • start_time  │
│  • probability   │                 │       │  • end_time    │
│  • priority      │                 │       │  • type        │
│  • expected_     │                 │       │  • location    │
│    close_date    │                 │       │  • status      │
└────────┬─────────┘                 │       │  • google_id   │
         │                           │       └────────────────┘
         │ 1:N                       │
         │                           │
         │                           │
┌────────▼─────────┐                 │       ┌────────────────┐
│   activities     │                 │       │    emails      │
│   (deal-linked)  │                 │       │                │
│                  │                 │       │  • id          │
│  • id            │                 │       │  • user_id(FK) │
│  • user_id (FK)  │                 │       │  • client_id   │
│  • client_id(FK) │─────────────────┘       │    (FK)        │
│  • deal_id (FK)  │                         │  • gmail_id    │
│  • type          │                         │  • subject     │
│  • title         │                         │  • from_email  │
│  • description   │                         │  • to_email    │
│  • completed     │                         │  • body_html   │
└──────────────────┘                         │  • is_read     │
                                             └────────────────┘
```

## Table Relationships

### Primary Relationships

```
auth.users (1) ──────── (1) user_profiles

user_profiles (1) ──────── (N) clients
user_profiles (1) ──────── (N) deals
user_profiles (1) ──────── (N) activities
user_profiles (1) ──────── (N) meetings
user_profiles (1) ──────── (N) automations
user_profiles (1) ──────── (N) emails

clients (1) ──────── (N) deals
clients (1) ──────── (N) meetings
clients (1) ──────── (N) activities
clients (1) ──────── (N) emails

deals (1) ──────── (N) activities
```

### Cascade Behaviors

```
DELETE auth.users
  └─> CASCADE DELETE user_profiles
        └─> CASCADE DELETE clients
              ├─> CASCADE DELETE deals
              │     └─> CASCADE DELETE activities (deal-linked)
              ├─> CASCADE DELETE meetings
              ├─> SET NULL activities (client-linked)
              └─> SET NULL emails
```

## Pipeline Stages Flow

```
┌──────────┐    ┌────────────┐    ┌──────────┐    ┌─────────────┐
│   LEAD   │───▶│  QUALIFIED │───▶│ PROPOSAL │───▶│ NEGOTIATION │
│          │    │            │    │          │    │             │
│ prob: 20%│    │ prob: 60%  │    │ prob: 75%│    │  prob: 85%  │
└──────────┘    └────────────┘    └──────────┘    └─────────────┘
                                                           │
                                                           │
                              ┌────────────────────────────┴────────┐
                              │                                     │
                              ▼                                     ▼
                    ┌───────────────┐                    ┌────────────────┐
                    │  CLOSED WON   │                    │  CLOSED LOST   │
                    │               │                    │                │
                    │  prob: 100%   │                    │   prob: 0%     │
                    │  ✓ Won!       │                    │   ✗ Lost       │
                    └───────────────┘                    └────────────────┘
```

## Activity Types

```
activities.type:
  ┌─────────────────┐
  │  email          │  Sent/received emails
  ├─────────────────┤
  │  call           │  Phone calls
  ├─────────────────┤
  │  meeting        │  In-person/video meetings
  ├─────────────────┤
  │  task           │  To-do items (completed: boolean)
  ├─────────────────┤
  │  note           │  General notes
  └─────────────────┘
```

## Client Status Lifecycle

```
┌──────────┐
│ prospect │  Initial lead
└─────┬────┘
      │
      ▼
┌──────────┐
│  active  │  Engaged client (has deals/activities)
└─────┬────┘
      │
      ├────────────┐
      │            │
      ▼            ▼
┌──────────┐  ┌──────────┐
│ inactive │  │ churned  │  No recent activity / Lost customer
└──────────┘  └──────────┘
```

## Meeting Status Flow

```
┌───────────┐
│ scheduled │  Initial state
└─────┬─────┘
      │
      ├─────────────┬──────────────┐
      │             │              │
      ▼             ▼              ▼
┌───────────┐  ┌──────────┐  ┌──────────┐
│ completed │  │cancelled │  │ no-show  │
└───────────┘  └──────────┘  └──────────┘
```

## Data Metrics & Aggregations

### Client Summary View

```sql
client_summary (VIEW):
  • client.* (all fields)
  • active_deals_count      (COUNT deals WHERE stage NOT IN won/lost)
  • total_deals_count       (COUNT all deals)
  • active_deals_value      (SUM value WHERE stage NOT IN won/lost)
  • total_deals_value       (SUM all deal values)
  • total_activities_count  (COUNT all activities)
```

### Pipeline Summary View

```sql
pipeline_summary (VIEW):
  • user_id
  • stage
  • deal_count         (COUNT deals per stage)
  • total_value        (SUM values per stage)
  • avg_value          (AVG value per stage)
  • avg_probability    (AVG probability per stage)
```

## Automatic Triggers

### 1. Update Timestamps

```
ON UPDATE clients       ──▶ SET updated_at = NOW()
ON UPDATE deals         ──▶ SET updated_at = NOW()
ON UPDATE meetings      ──▶ SET updated_at = NOW()
ON UPDATE automations   ──▶ SET updated_at = NOW()
```

### 2. Track Deal Stage Changes

```
ON UPDATE deals WHERE stage CHANGED:
  ├─▶ SET stage_changed_at = NOW()
  └─▶ IF stage IN (closed_won, closed_lost):
        └─▶ SET actual_close_date = TODAY
```

### 3. Update Client Last Contact

```
ON INSERT activities WHERE client_id IS NOT NULL:
  └─▶ UPDATE clients SET last_contact_at = NOW()
```

### 4. Notify n8n Webhooks

```
ON UPDATE deals WHERE stage CHANGED:
  └─▶ FOR EACH automation WHERE trigger_type = 'deal_stage_changed':
        ├─▶ POST to automation.n8n_webhook_url
        └─▶ UPDATE automation.total_runs + 1
```

## Row Level Security (RLS)

All tables enforce user data isolation:

```sql
POLICY "users_own_data":
  USING (auth.uid() = user_id)

This means:
  ✅ Users can SELECT/INSERT/UPDATE/DELETE their own data
  ❌ Users CANNOT access other users' data
  ✅ Enforced at the database level (not application level)
```

## Indexes for Performance

### High-Traffic Queries Optimized

```
clients:
  • user_id (filter by user)
  • status (filter by status)
  • company_name (search/sort)
  • email (lookup)

deals:
  • user_id (filter by user)
  • client_id (join to clients)
  • stage (pipeline filtering)
  • expected_close_date (sorting)
  • priority (filtering)

activities:
  • user_id (filter by user)
  • created_at DESC (recent activity feed)
  • client_id, deal_id (joins)
  • type (filter by activity type)

meetings:
  • user_id (filter by user)
  • start_time (calendar views)
  • status (filter scheduled/completed)
  • google_calendar_id (integration sync)
```

## Integration Points

### Gmail (emails table)

```
emails.gmail_message_id  ──▶  Gmail API Message ID
emails.gmail_thread_id   ──▶  Gmail API Thread ID

Sync flow:
  Gmail ──[fetch]──▶ emails table ──[display]──▶ React UI
```

### Google Calendar (meetings table)

```
meetings.google_calendar_id  ──▶  Google Calendar Event ID
meetings.google_meet_url     ──▶  Google Meet Join URL

Sync flow:
  meetings table ◀──[2-way sync]──▶ Google Calendar
```

### n8n Webhooks (automations table)

```
automations.n8n_webhook_url  ──▶  n8n Webhook Endpoint

Trigger flow:
  Database Change ──[trigger]──▶ n8n Webhook ──[execute]──▶ Workflow
```

---

## Quick Stats

- **6 Core Tables**: clients, deals, activities, meetings, automations, emails
- **1 Auth Table**: user_profiles (extends auth.users)
- **2 Views**: client_summary, pipeline_summary
- **4 Automatic Triggers**: timestamps, stage tracking, last contact, webhooks
- **6 RLS Policies**: One per table for user isolation
- **20+ Indexes**: Optimized for common queries
- **3 Integrations**: Gmail, Google Calendar, n8n

---

For implementation details, see [crm-schema.sql](./crm-schema.sql)
