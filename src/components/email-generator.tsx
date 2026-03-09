"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  EMAIL_TEMPLATES,
  renderTemplate,
  type EmailTemplate,
} from "@/lib/email-templates";
import { toast } from "sonner";

interface EmailGeneratorProps {
  businessName: string;
  category: string;
  city: string;
  hasWebsite: boolean;
  websiteStatus: string | null;
}

const STORAGE_KEY_NAME = "leadradar-your-name";
const STORAGE_KEY_WEBSITE = "leadradar-your-website";

export function EmailGenerator({
  businessName,
  category,
  city,
  hasWebsite,
  websiteStatus,
}: EmailGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(
    EMAIL_TEMPLATES[0]
  );
  const [yourName, setYourName] = useState("");
  const [yourWebsite, setYourWebsite] = useState("");
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setYourName(localStorage.getItem(STORAGE_KEY_NAME) ?? "");
      setYourWebsite(localStorage.getItem(STORAGE_KEY_WEBSITE) ?? "");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && yourName) {
      localStorage.setItem(STORAGE_KEY_NAME, yourName);
    }
  }, [yourName]);

  useEffect(() => {
    if (typeof window !== "undefined" && yourWebsite) {
      localStorage.setItem(STORAGE_KEY_WEBSITE, yourWebsite);
    }
  }, [yourWebsite]);

  const rendered = renderTemplate(selectedTemplate, {
    businessName,
    category,
    city,
    hasWebsite,
    websiteStatus,
    yourName,
    yourWebsite,
  });

  const copyToClipboard = async (text: string, type: "subject" | "body") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
      if (type === "subject") {
        setCopiedSubject(true);
        setTimeout(() => setCopiedSubject(false), 2000);
      } else {
        setCopiedBody(true);
        setTimeout(() => setCopiedBody(false), 2000);
      }
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-primary"
            aria-label="Generate outreach email"
          >
            <Mail className="size-3.5" />
          </Button>
        }
      />
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4 text-primary" />
            Email Generator
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Outreach for{" "}
            <span className="font-medium text-foreground">
              {businessName}
            </span>
          </p>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Your info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Your Name
              </label>
              <Input
                placeholder="John Doe"
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Your Website
              </label>
              <Input
                placeholder="yoursite.com"
                value={yourWebsite}
                onChange={(e) => setYourWebsite(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Template selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Template
            </label>
            <div className="flex gap-1.5">
              {EMAIL_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                    selectedTemplate.id === tmpl.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Subject
              </label>
              <button
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                onClick={() =>
                  copyToClipboard(rendered.subject, "subject")
                }
              >
                {copiedSubject ? (
                  <>
                    <Check className="size-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="px-3 py-2.5 rounded-lg bg-muted/50 border text-sm font-medium">
              {rendered.subject}
            </div>
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Body
              </label>
              <button
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                onClick={() => copyToClipboard(rendered.body, "body")}
              >
                {copiedBody ? (
                  <>
                    <Check className="size-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <Textarea
              value={rendered.body}
              readOnly
              rows={12}
              className="text-sm font-mono leading-relaxed resize-none bg-muted/30"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 gap-1.5"
              onClick={() =>
                copyToClipboard(
                  `Subject: ${rendered.subject}\n\n${rendered.body}`,
                  "body"
                )
              }
            >
              {copiedBody ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copiedBody ? "Copied!" : "Copy Full Email"}
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                const mailto = `mailto:?subject=${encodeURIComponent(rendered.subject)}&body=${encodeURIComponent(rendered.body)}`;
                window.open(mailto);
              }}
            >
              <ExternalLink className="size-4" />
              Email Client
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
