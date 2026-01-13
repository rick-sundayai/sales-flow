# Claude Code Skills for SalesFlow

This directory contains custom Skills for Claude Code to help with development of the SalesFlow CRM application.

## Available Skills

### 1. Brainstorming (`brainstorming`)
Explores user intent, requirements and design before implementation through collaborative dialogue.

**Triggers when:**
- Creating new features
- Building components
- Adding functionality
- Modifying behavior
- Any creative work requiring design decisions

**Key features:**
- Collaborative exploration through focused questions
- Multiple approach proposals with trade-offs
- Incremental design validation (200-300 word sections)
- YAGNI-focused feature scope management
- Documentation of validated designs

**Note:** This skill MUST be used before any creative implementation work.

### 2. Writing Plans (`writing-plans`)
Creates comprehensive, bite-sized implementation plans for multi-step tasks.

**Triggers when:**
- Have a spec or requirements document
- Need to break down complex tasks
- Before starting multi-step implementation
- Working with junior developers or handoff scenarios

**Key features:**
- Bite-sized tasks (2-5 minutes each)
- Complete code examples in plan
- Exact file paths and commands
- TDD workflow integration
- Commit strategy included

### 3. Writing Skills (`writing-skills`)
Test-driven development approach for creating and editing Claude Code skills.

**Triggers when:**
- Creating new skills
- Editing existing skills
- Verifying skills work before deployment
- Need to document reusable patterns

**Key features:**
- RED-GREEN-REFACTOR cycle for documentation
- Pressure scenario testing with subagents
- Rationalization-proofing techniques
- Claude Search Optimization (CSO) guidelines
- Comprehensive deployment checklist

### 4. Frontend Design (`frontend-design`)
Creates distinctive, production-grade frontend interfaces with high design quality.

**Triggers when:**
- Building web components
- Creating pages or applications
- Need unique, memorable UI
- Avoiding generic AI aesthetics

**Key features:**
- Bold aesthetic direction selection
- Typography with distinctive font choices
- Rich animations and micro-interactions
- Unexpected layouts and spatial composition
- Production-ready, functional code

**Note:** Generates creative, polished code that avoids cookie-cutter design patterns.

### 5. TypeScript Safety (`typescript-safety`)
Ensures TypeScript code follows strict mode compliance and proper type annotations.

**Triggers when:**
- Writing TypeScript code
- Fixing type errors
- Refactoring components
- Mentions of TypeScript, type safety, or strict mode

**Key features:**
- Verifies strict mode compliance
- Ensures Supabase type safety
- Checks React Query hook typing
- Validates component props interfaces

### 6. Supabase Query Patterns (`supabase-query-patterns`)
Enforces consistent React Query and Supabase data fetching patterns.

**Triggers when:**
- Implementing database queries
- Creating mutations
- Fetching data
- Mentions of Supabase, React Query, TanStack Query, or mutations

**Key features:**
- Server vs client data fetching patterns
- Mutation implementation with optimistic updates
- Query key conventions
- Real-time subscription patterns

### 7. Component Architecture (`component-architecture`)
Ensures consistent React component structure and shadcn/ui patterns.

**Triggers when:**
- Creating components
- Refactoring React code
- Setting up forms
- Mentions of React components, Server/Client Components, or shadcn/ui

**Key features:**
- Server vs Client Component decision guidance
- shadcn/ui component usage patterns
- Form validation with react-hook-form + zod
- Modal and dialog patterns

### 8. TailwindCSS Styling (`tailwind-styling`)
Maintains consistent TailwindCSS styling and design system.

**Triggers when:**
- Styling components
- Creating layouts
- Implementing responsive design
- Mentions of TailwindCSS, styling, CSS, or dark mode

**Key features:**
- Color system and CSS variables
- Dark mode support
- Responsive design patterns
- Typography and spacing scales

### 9. Testing Implementation (`testing-implementation`)
Guides Jest and React Testing Library test implementation.

**Triggers when:**
- Writing tests
- Debugging test failures
- Improving coverage
- Mentions of testing, Jest, React Testing Library, or test coverage

**Key features:**
- Unit, integration, and E2E testing patterns
- Component testing with RTL
- React Query hook testing
- Mock patterns for Supabase

### 10. Security Review (`security-review`)
Reviews code for security vulnerabilities and best practices.

**Triggers when:**
- Reviewing security-sensitive code
- Implementing authentication
- Working with API routes
- Mentions of security, vulnerabilities, or data protection

**Key features:**
- Authentication & authorization verification
- Input validation and SQL injection prevention
- XSS and CSRF protection
- Sensitive data handling
- Row Level Security (RLS) policy verification

## Using Skills

### Automatic Activation
Skills activate automatically when your request matches their description:

```
You: "How should I structure this database query?"
Claude: [Automatically loads supabase-query-patterns Skill]
```

### Manual Invocation
You can also invoke Skills explicitly:

```
/typescript-safety
Review this file for type safety issues.
```

### List Available Skills
To see all available Skills:

```
What Skills are available?
```

## Skill Organization

```
.claude/
├── skills/
│   ├── brainstorming/
│   │   └── SKILL.md
│   ├── writing-plans/
│   │   └── SKILL.md
│   ├── writing-skills/
│   │   └── SKILL.md
│   ├── frontend-design/
│   │   └── SKILL.md
│   ├── typescript-safety/
│   │   └── SKILL.md
│   ├── supabase-query-patterns/
│   │   └── SKILL.md
│   ├── component-architecture/
│   │   └── SKILL.md
│   ├── tailwind-styling/
│   │   └── SKILL.md
│   ├── testing-implementation/
│   │   └── SKILL.md
│   └── security-review/
│       └── SKILL.md
├── settings.json              # Project permissions config
├── settings.local.json        # Personal overrides (gitignored)
└── README.md                  # This file
```

## Modifying Skills

Skills are checked into version control and shared with the team. To modify:

1. Edit the `SKILL.md` file in the appropriate directory
2. Changes take effect immediately (no restart needed)
3. Commit changes to share with team

## Personal Overrides

Create `.claude/settings.local.json` for personal configuration:

```json
{
  "permissions": {
    "allow": [
      "Bash(your-custom-command:*)"
    ]
  }
}
```

This file is gitignored and won't affect other team members.

## Tech Stack Context

These Skills are specifically designed for:

- **Framework:** Next.js 15 with App Router and Turbopack
- **Database:** PostgreSQL via Supabase with RLS
- **UI:** shadcn/ui components + TailwindCSS
- **State:** TanStack Query (React Query)
- **Types:** TypeScript with strict mode
- **Testing:** Jest + React Testing Library

## Contributing

To add a new Skill:

1. Create a new directory: `.claude/skills/skill-name/`
2. Create `SKILL.md` with YAML frontmatter and markdown instructions
3. Write a clear description that includes trigger keywords
4. Test that Claude discovers and applies it correctly
5. Commit to version control

See [Claude Code Skills documentation](https://code.claude.com/docs/en/skills.md) for full details.

## Resources

- [Claude Code Skills Docs](https://code.claude.com/docs/en/skills.md)
- [Claude Code Subagents](https://code.claude.com/docs/en/sub-agents.md)
- [Project CLAUDE.md](../CLAUDE.md) - Main project documentation
