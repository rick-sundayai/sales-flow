import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'

export function getDealStageProbability(stage: DealStage): number {
  switch (stage) {
    case 'lead':
      return 10
    case 'qualified':
      return 30
    case 'proposal':
      return 60
    case 'negotiation':
      return 80
    case 'closed_won':
      return 100
    case 'closed_lost':
      return 0
    default:
      return 50
  }
}

export function getDealStageDisplayName(stage: DealStage): string {
  switch (stage) {
    case 'lead':
      return 'Lead'
    case 'qualified':
      return 'Qualified'
    case 'proposal':
      return 'Proposal'
    case 'negotiation':
      return 'Negotiation'
    case 'closed_won':
      return 'Closed Won'
    case 'closed_lost':
      return 'Closed Lost'
    default:
      return stage
  }
}
