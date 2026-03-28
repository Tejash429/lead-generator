"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface AIPitchModalProps {
  businessName: string;
  category: string;
  city: string;
  reviewCount: number | null;
  rating: number | null;
  leadId?: string;
  onContacted?: (leadId: string) => void;
}

export function AIPitchModal({
  businessName,
  category,
  city,
  reviewCount,
  rating,
  leadId,
  onContacted,
}: AIPitchModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showContactPrompt, setShowContactPrompt] = useState(false);
  const [marking, setMarking] = useState(false);

  const generate = async () => {
    setLoading(true);
    setEmail("");
    setCopied(false);
    setShowContactPrompt(false);
    try {
      const res = await fetch("/api/generate-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, category, city, reviewCount, rating }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const main =
          (typeof data.error === "string" && data.error) || "Failed to generate";
        const hint =
          typeof data.hint === "string" && data.hint.trim()
            ? data.hint.trim()
            : undefined;
        if (hint) toast.error(main, { description: hint });
        else toast.error(main);
        return;
      }
      setEmail(data.email as string);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate pitch";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);

      if (leadId && onContacted) {
        setShowContactPrompt(true);
      }
    } catch {
      toast.error("Failed to copy");
    }
  };

  const markContacted = async () => {
    if (!leadId) return;
    setMarking(true);
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: leadId,
          status: "contacted",
          lastContactedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        toast.success("Marked as contacted");
        onContacted?.(leadId);
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setMarking(false);
      setShowContactPrompt(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setShowContactPrompt(false);
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-primary"
                  aria-label="Generate AI pitch email"
                  onClick={() => {
                    if (!email) generate();
                  }}
                />
              }
            />
          }
        >
          <Sparkles className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>AI Pitch</TooltipContent>
      </Tooltip>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            AI Pitch Email
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Personalized pitch for{" "}
            <span className="font-medium text-foreground">{businessName}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Generating personalized pitch...
                </p>
              </div>
            </div>
          )}

          {!loading && email && (
            <>
              <Textarea
                value={email}
                readOnly
                rows={12}
                className="text-sm leading-relaxed resize-none bg-muted/30"
              />

              {showContactPrompt ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex-1">
                    Mark as Contacted?
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setShowContactPrompt(false)}
                  >
                    Skip
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={markContacted}
                    disabled={marking}
                  >
                    {marking && <Loader2 className="size-3 animate-spin" />}
                    Yes, mark it
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button className="flex-1 gap-1.5" onClick={copyEmail}>
                    {copied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    {copied ? "Copied!" : "Copy Email"}
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    onClick={generate}
                  >
                    <Sparkles className="size-4" />
                    Regenerate
                  </Button>
                </div>
              )}
            </>
          )}

          {!loading && !email && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground mb-4">
                Generate a personalized cold email using AI
              </p>
              <Button onClick={generate} className="gap-1.5">
                <Sparkles className="size-4" />
                Generate Pitch
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
