"use client";

import { useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  PanInfo,
} from "framer-motion";
import {
  X,
  ChevronRight,
  Sparkles,
  XCircle,
  TrendingUp,
  MapPin,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useNewLeads,
  useSkipLead,
  useRejectLead,
  useEnrichLead,
} from "@/lib/queries/leads";
import { AddClientModal } from "./AddClientModal";
import { Tables } from "@/lib/types/database.types";

type Lead = Tables<"job_postings">;

interface DailyStackModalProps {
  open: boolean;
  onClose: () => void;
}

export function DailyStackModal({ open, onClose }: DailyStackModalProps) {
  const { data: leads, isLoading } = useNewLeads();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);

  const skipLead = useSkipLead();
  const rejectLead = useRejectLead();
  const enrichLead = useEnrichLead();

  const currentLead = leads?.[currentIndex];

  // Reset index when modal opens or leads change
  useEffect(() => {
    if (open && leads && leads.length > 0) {
      setCurrentIndex(0);
      setDirection(null);
    }
  }, [open, leads]);

  const handleSkip = async () => {
    if (!currentLead) return;
    setDirection("left");
    await skipLead.mutateAsync(currentLead.id);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
    }, 300);
  };

  const handleReject = async () => {
    if (!currentLead) return;
    setDirection("left");
    await rejectLead.mutateAsync(currentLead.id);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
    }, 300);
  };

  const handleAddToPipeline = () => {
    if (!currentLead) return;
    setSelectedLead(currentLead);
    setShowAddClient(true);
  };

  const handleEnrich = async () => {
    if (!currentLead) return;
    setIsEnriching(true);
    try {
      await enrichLead.mutateAsync(currentLead.id);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleConvert = () => {
    setDirection("right");
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
      setShowAddClient(false);
      setSelectedLead(null);
    }, 300);
  };

  // Check if we've reviewed all leads
  if (!isLoading && leads && currentIndex >= leads.length) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="daily-stack-complete max-w-2xl border-0 bg-card">
          <VisuallyHidden>
            <DialogTitle>Daily Stack Complete</DialogTitle>
          </VisuallyHidden>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mb-6"
            >
              <Sparkles className="h-24 w-24 text-primary" strokeWidth={1.5} />
            </motion.div>
            <h2 className="mb-3 font-heading text-5xl font-black uppercase tracking-tight text-foreground">
              Stack Cleared
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              You've reviewed all {leads.length} leads. Great work!
            </p>
            <Button
              onClick={onClose}
              size="lg"
              className="px-8 text-lg font-bold"
            >
              Close
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="daily-stack-modal max-w-5xl border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>Daily Stack - Lead Review</DialogTitle>
          </VisuallyHidden>
          <div className="relative flex min-h-[700px] items-center justify-center">
            {/* Background blur orbs */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{
                  x: [0, 100, 0],
                  y: [0, -100, 0],
                }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute left-0 top-0 h-96 w-96 rounded-full bg-[hsl(var(--primary))]/20 blur-3xl"
              />
              <motion.div
                animate={{
                  x: [0, -100, 0],
                  y: [0, 100, 0],
                }}
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[hsl(var(--destructive))]/20 blur-3xl"
              />
            </div>

            {/* Header */}
            <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-8 pt-6">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                >
                  <Sparkles className="h-6 w-6 text-[hsl(var(--primary))]" />
                </motion.div>
                <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-foreground">
                  Daily Stack
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-muted px-4 py-2 backdrop-blur-sm">
                  <span className="font-mono text-sm font-bold text-primary">
                    {currentIndex + 1} / {leads?.length || 0}
                  </span>
                </div>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-muted text-foreground backdrop-blur-sm hover:bg-muted/80"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Card Stack */}
            <div className="relative h-[600px] w-full max-w-2xl">
              <AnimatePresence mode="wait">
                {currentLead && (
                  <LeadCard
                    key={currentLead.id}
                    lead={currentLead}
                    direction={direction}
                    onSkip={handleSkip}
                    onReject={handleReject}
                    onAddToPipeline={handleAddToPipeline}
                    onEnrich={handleEnrich}
                    isEnriching={isEnriching}
                  />
                )}
              </AnimatePresence>

              {/* Preview next card */}
              {leads && currentIndex < leads.length - 1 && (
                <div className="pointer-events-none absolute inset-0 scale-95 opacity-30">
                  <div className="h-full w-full rounded-3xl border-2 border-border bg-card backdrop-blur-xl" />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6 px-8">
              <ActionButton
                onClick={handleSkip}
                icon={<ChevronRight className="h-6 w-6" />}
                label="Skip"
                color="yellow"
                disabled={!currentLead}
              />
              <ActionButton
                onClick={handleReject}
                icon={<XCircle className="h-6 w-6" />}
                label="Reject"
                color="red"
                disabled={!currentLead}
              />
              <ActionButton
                onClick={handleAddToPipeline}
                icon={<TrendingUp className="h-6 w-6" />}
                label="Add to Pipeline"
                color="green"
                disabled={!currentLead}
                primary
              />
              <ActionButton
                onClick={handleEnrich}
                icon={<Sparkles className="h-6 w-6" />}
                label={isEnriching ? "Enriching..." : "Enrich"}
                color="purple"
                disabled={!currentLead || isEnriching}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Client Modal for conversion */}
      {selectedLead && (
        <AddClientModal
          open={showAddClient}
          onClose={() => {
            setShowAddClient(false);
            setSelectedLead(null);
          }}
          onSuccess={handleConvert}
          prefilledData={{
            company_name: "Company from Job Posting",
            contact_name: "",
            email: "",
            phone: "",
          }}
        />
      )}
    </>
  );
}

interface LeadCardProps {
  lead: Lead;
  direction: "left" | "right" | null;
  onSkip: () => void;
  onReject: () => void;
  onAddToPipeline: () => void;
  onEnrich: () => void;
  isEnriching: boolean;
}

function LeadCard({
  lead,
  direction,
  onSkip,
  onReject,
  onAddToPipeline,
  onEnrich,
  isEnriching,
}: LeadCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);
  const opacity = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [0.5, 1, 1, 1, 0.5]
  );

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onAddToPipeline();
    } else if (info.offset.x < -threshold) {
      onReject();
    }
  };

  const formatSalary = () => {
    return lead.salary_range || "Salary not specified";
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      style={{ x, rotate, opacity }}
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{
        scale: 0.9,
        opacity: 0,
        x: direction === "left" ? -300 : direction === "right" ? 300 : 0,
        transition: { duration: 0.3 },
      }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      <div className="h-full w-full overflow-hidden rounded-3xl border-2 border-border bg-card shadow-2xl backdrop-blur-xl">
        {/* Enrichment overlay */}
        {isEnriching && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="mb-4"
              >
                <Sparkles className="mx-auto h-16 w-16 text-[hsl(var(--primary))]" />
              </motion.div>
              <p className="font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
                Enriching Lead...
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Gathering additional data
              </p>
            </div>
          </div>
        )}

        {/* Card Content */}
        <div className="flex h-full flex-col overflow-y-auto p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="mb-2 font-heading text-4xl font-black uppercase leading-tight tracking-tight text-foreground">
                  {lead.title}
                </h3>
                <p className="text-xl font-semibold text-primary">
                  Company Name: {lead.company_name || "Not specified"}
                </p>
              </div>
              {/* Priority Score Badge */}
              {lead.priority_score !== null &&
                lead.priority_score !== undefined && (
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      className={`text-base px-4 py-2 font-bold ${
                        lead.priority_score >= 80
                          ? "bg-primary/20 text-primary border-primary/50"
                          : lead.priority_score >= 60
                          ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      <Sparkles className="mr-1.5 h-4 w-4" />
                      Score: {lead.priority_score}
                    </Badge>
                    {lead.priority_score >= 80 && (
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                        High Priority
                      </span>
                    )}
                  </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {lead.location && (
                <div className="flex items-center gap-2 rounded-xl bg-muted p-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground/90">
                    {lead.location}
                  </span>
                </div>
              )}
              {lead.source && (
                <div className="flex items-center gap-2 rounded-xl bg-muted p-3">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span className="text-sm capitalize text-foreground/90">
                    {lead.source}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl bg-muted p-3">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground/90">
                  {formatSalary()}
                </span>
              </div>
            </div>
          </div>

          {/* Job Link */}
          {lead.job_link && (
            <div className="mt-auto pt-6">
              <a
                href={lead.job_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View Original Job Posting →
              </a>
            </div>
          )}

          {/* Priority Reasoning - Moved up for prominence */}
          {lead.priority_reasoning && (
            <div className="mb-6 rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h4 className="font-heading text-lg font-bold uppercase tracking-wide text-primary">
                  AI Analysis
                </h4>
              </div>
              <p className="leading-relaxed text-foreground">
                {lead.priority_reasoning}
              </p>
            </div>
          )}

          {/* Description */}
          {lead.description && (
            <div className="mb-6 rounded-xl border border-border bg-muted/30 p-5">
              <h4 className="mb-3 font-heading text-base font-bold uppercase tracking-wide text-foreground">
                Job Description
              </h4>
              <div className="max-h-64 overflow-y-auto pr-2">
                <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                  {lead.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Swipe indicators */}
        <motion.div
          style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
          className="absolute left-8 top-8 rounded-2xl bg-red-500/20 px-6 py-3 backdrop-blur-sm"
        >
          <span className="font-heading text-2xl font-black uppercase text-red-500">
            Reject
          </span>
        </motion.div>
        <motion.div
          style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
          className="absolute right-8 top-8 rounded-2xl bg-primary/20 px-6 py-3 backdrop-blur-sm"
        >
          <span className="font-heading text-2xl font-black uppercase text-primary">
            Accept
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: "yellow" | "red" | "green" | "purple";
  disabled?: boolean;
  primary?: boolean;
}

function ActionButton({
  onClick,
  icon,
  label,
  color,
  disabled,
  primary,
}: ActionButtonProps) {
  const colorMap = {
    yellow: {
      bg: "bg-yellow-500/20",
      hover: "hover:bg-yellow-500/30",
      text: "text-yellow-500",
      border: "border-yellow-500/50",
    },
    red: {
      bg: "bg-red-500/20",
      hover: "hover:bg-red-500/30",
      text: "text-red-500",
      border: "border-red-500/50",
    },
    green: {
      bg: "bg-primary/20",
      hover: "hover:bg-primary/30",
      text: "text-primary",
      border: "border-primary/50",
    },
    purple: {
      bg: "bg-purple-500/20",
      hover: "hover:bg-purple-500/30",
      text: "text-purple-500",
      border: "border-purple-500/50",
    },
  };

  const colors = colorMap[color];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: primary ? 1.1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        flex flex-col items-center gap-2 rounded-2xl border-2 p-4 backdrop-blur-sm transition-all
        ${primary ? "px-8 py-5" : ""}
        ${colors.bg} ${colors.hover} ${colors.text} ${colors.border}
        disabled:cursor-not-allowed disabled:opacity-50
      `}
    >
      <div className={primary ? "scale-125" : ""}>{icon}</div>
      <span
        className={`font-heading font-bold uppercase tracking-tight ${
          primary ? "text-base" : "text-xs"
        }`}
      >
        {label}
      </span>
    </motion.button>
  );
}
