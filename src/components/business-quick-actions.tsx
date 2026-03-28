"use client";

import { Copy, Globe, MapPin, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  googleMapsUrl,
  googleReviewsUrl,
  googleSearchUrl,
} from "@/lib/google-links";
import { toast } from "sonner";

const linkBaseClass =
  "inline-flex items-center justify-center size-8 shrink-0 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors";

export function CopyBusinessLabel({
  businessName,
  city,
  className,
}: {
  businessName: string;
  city: string;
  className?: string;
}) {
  const handleCopy = async () => {
    const text = city.trim()
      ? `${businessName.trim()}, ${city.trim()}`
      : businessName.trim();
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied!");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("size-7 text-gray-400 hover:text-gray-700", className)}
            aria-label="Copy name and city"
            onClick={handleCopy}
          />
        }
      >
        <Copy className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>Copy name & city</TooltipContent>
    </Tooltip>
  );
}

export function QuickGoogleActions({
  businessName,
  city,
  placeId,
  website,
  className,
  linkClassName,
}: {
  businessName: string;
  city: string;
  placeId?: string | null;
  website?: string | null;
  className?: string;
  linkClassName?: string;
}) {
  const searchHref = googleSearchUrl(businessName, city);
  const mapsHref = googleMapsUrl(businessName, city, placeId);
  const reviewsHref = googleReviewsUrl(businessName, city);
  const linkClass = cn(linkBaseClass, linkClassName);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <Tooltip>
        <TooltipTrigger
          render={
            <a
              href={searchHref}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
              aria-label="Google search"
            />
          }
        >
          <Search className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>Google search</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
              aria-label="Google Maps"
            />
          }
        >
          <MapPin className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>Google Maps</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <a
              href={reviewsHref}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
              aria-label="Google reviews"
            />
          }
        >
          <Star className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>Google reviews</TooltipContent>
      </Tooltip>
      {website ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
                aria-label="Visit website"
              />
            }
          >
            <Globe className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent>Visit site</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
