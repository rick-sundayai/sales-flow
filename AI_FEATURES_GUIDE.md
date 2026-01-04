# AI Features Integration Guide

This guide explains how to integrate and use the AI-powered features from the Gemini POC into SalesFlow.

## Features Implemented

### 1. Google Gemini AI Service (`/src/lib/services/gemini-service.ts`)

**Capabilities:**
- **Deal Risk Analysis**: AI-powered assessment of deal risks with actionable recommendations
- **Email Drafting**: Context-aware email generation for different sales scenarios
- **Smart Suggestions**: AI-generated next actions based on deal status

**Usage:**
```typescript
import { geminiService } from '@/lib/services/gemini-service';

// Analyze deal risks
const analysis = await geminiService.analyzeDealRisks(dealData);

// Generate email draft
const emailDraft = await geminiService.generateEmailDraft({
  dealTitle: 'Software License Deal',
  dealStage: 'proposal',
  clientName: 'John Doe',
  purpose: 'follow-up'
});
```

### 2. Command Palette (`/src/components/ui/command-palette.tsx`)

**Features:**
- Global search with Cmd+K / Ctrl+K
- Search across navigation, actions, clients, and deals
- Instant navigation and quick actions
- Fuzzy search with keywords

**Integration:**
```typescript
import { useCommandPalette, CommandPalette } from '@/components/ui/command-palette';

function MyComponent() {
  const { isOpen, onOpen, onClose } = useCommandPalette();
  
  return (
    <CommandPalette 
      isOpen={isOpen}
      onClose={onClose}
      clients={clients}
      deals={deals}
    />
  );
}
```

### 3. AI Deal Risk Analysis (`/src/components/crm/deal-risk-analysis.tsx`)

**Features:**
- Real-time risk assessment with confidence scores
- Identification of specific risk factors
- AI-recommended next actions
- Visual risk indicators (low/medium/high)

**Usage:**
```typescript
import { DealRiskAnalysisComponent } from '@/components/crm/deal-risk-analysis';

<DealRiskAnalysisComponent dealData={dealData} />
```

### 4. AI Email Composer (`/src/components/crm/ai-email-composer.tsx`)

**Features:**
- Context-aware email generation
- Multiple email purposes (follow-up, proposal, closing, etc.)
- Custom instructions support
- One-click copy and send functionality

**Usage:**
```typescript
import { AIEmailComposer } from '@/components/crm/ai-email-composer';

<AIEmailComposer 
  dealData={dealData}
  onSendEmail={(email) => handleSendEmail(email)}
/>
```

### 5. Slide-over Deal Drawer (`/src/components/crm/deal-drawer.tsx`)

**Features:**
- Comprehensive deal overview
- Integrated AI analysis and email composer
- Activity timeline
- Client information
- Tabbed interface for organized content

**Usage:**
```typescript
import { DealDrawer } from '@/components/crm/deal-drawer';

<DealDrawer
  isOpen={isDrawerOpen}
  onClose={() => setIsDrawerOpen(false)}
  deal={selectedDeal}
  onSendEmail={(email) => handleSendEmail(email)}
/>
```

### 6. Bento Grid Dashboard (`/src/components/dashboard/bento-grid-dashboard.tsx`)

**Features:**
- Modern grid layout with variable card sizes
- Interactive charts using Recharts
- AI insights integration
- Command palette integration
- Quick actions and metrics

**Usage:**
```typescript
import { BentoGridDashboard } from '@/components/dashboard/bento-grid-dashboard';

<BentoGridDashboard 
  metrics={dashboardMetrics}
  deals={deals}
  clients={clients}
  recentActivities={activities}
/>
```

## Setup Instructions

### 1. Environment Configuration

Create `.env.local` based on `.env.local.example`:

```bash
# Copy example file
cp .env.local.example .env.local

# Edit with your API keys
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your-google-ai-api-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

### 2. Google AI API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` file

### 3. Dependencies Installed

The following packages have been added:
- `@google/generative-ai` - Google Gemini AI SDK
- `@headlessui/react` - For slide-over component
- `recharts` - For dashboard charts

## Integration Examples

### Replace Existing Dashboard

Replace your current dashboard page:

```typescript
// src/app/dashboard/page.tsx
import { BentoGridDashboard } from '@/components/dashboard/bento-grid-dashboard';

export default function DashboardPage() {
  // Your existing data fetching logic
  const { data: metrics } = useDashboardMetrics();
  const { data: deals } = useDeals();
  const { data: clients } = useClients();
  const { data: activities } = useRecentActivities();

  return (
    <BentoGridDashboard 
      metrics={metrics}
      deals={deals}
      clients={clients}
      recentActivities={activities}
    />
  );
}
```

### Add AI Features to Pipeline

```typescript
// In your pipeline component
import { DealDrawer } from '@/components/crm/deal-drawer';

function Pipeline() {
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleDealClick = (deal) => {
    setSelectedDeal(deal);
    setIsDrawerOpen(true);
  };

  return (
    <div>
      {/* Your pipeline UI */}
      
      <DealDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        deal={selectedDeal}
        onSendEmail={(email) => {
          // Integrate with your email service
          console.log('Sending email:', email);
        }}
      />
    </div>
  );
}
```

### Global Command Palette

Add to your root layout:

```typescript
// src/app/layout.tsx or your main layout component
import { useCommandPalette, CommandPalette } from '@/components/ui/command-palette';

export default function Layout({ children }) {
  const { isOpen, onOpen, onClose } = useCommandPalette();
  
  return (
    <div>
      {children}
      
      <CommandPalette 
        isOpen={isOpen}
        onClose={onClose}
        clients={clients}
        deals={deals}
      />
    </div>
  );
}
```

## Data Structure Requirements

### Deal Data Format

```typescript
interface DealData {
  id: string;
  title: string;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  priority: 'low' | 'medium' | 'high';
  client: {
    id: string;
    contact_name: string;
    company_name?: string;
    email?: string;
    phone?: string;
    status: string;
  };
  activities: Array<{
    id: string;
    type: 'email' | 'call' | 'meeting' | 'task' | 'note';
    title: string;
    description?: string;
    completed: boolean;
    created_at: string;
  }>;
}
```

## Customization

### Styling
All components use your existing Tailwind CSS classes and design tokens. You can customize:
- Colors in `tailwind.config.ts`
- Component variants in individual component files
- Layout spacing in the bento grid

### AI Prompts
Customize AI behavior by modifying prompts in `gemini-service.ts`:
- Risk analysis criteria
- Email tone and style
- Suggestion types

### Command Palette Items
Add custom actions in `command-palette.tsx`:
- New navigation items
- Custom keyboard shortcuts
- Additional search categories

## Best Practices

1. **Error Handling**: All AI features include fallback behavior for API failures
2. **Loading States**: Components show loading indicators during AI operations
3. **Type Safety**: Full TypeScript support with proper interfaces
4. **Performance**: Components are optimized with React best practices
5. **Accessibility**: ARIA labels and keyboard navigation support

## Troubleshooting

### AI Features Not Working
1. Check Google AI API key in environment variables
2. Verify API quotas and billing in Google Cloud Console
3. Check browser console for error messages

### Command Palette Not Opening
1. Ensure keyboard listeners are properly attached
2. Check for conflicting keyboard shortcuts
3. Verify component is rendered in the DOM

### Charts Not Displaying
1. Ensure Recharts is properly installed
2. Check data format matches expected structure
3. Verify ResponsiveContainer has proper dimensions

## Next Steps

1. **Integration Testing**: Test all features with real data
2. **Email Service**: Connect AI email composer to your email service
3. **Analytics**: Add tracking for AI feature usage
4. **Customization**: Adapt components to match your brand
5. **Performance**: Monitor API usage and optimize as needed