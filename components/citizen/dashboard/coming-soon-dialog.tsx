"use client";

import type { ReactNode } from "react";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ComingSoonDialogProps {
  /** Name of the feature that is not built yet (used as the dialog title). */
  feature: string;
  /** The trigger element — the whole quick-action card is passed here. */
  children: ReactNode;
}

/**
 * Reusable "in development" dialog.
 *
 * Renders a shadcn Dialog whose title is the feature name and whose body
 * explains the feature is not connected yet. The trigger is whatever element
 * is passed as `children`, so the caller keeps full control of the card UI.
 */
export function ComingSoonDialog({ feature, children }: ComingSoonDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center sm:items-start sm:text-left">
          <span className="grid size-11 place-items-center rounded-xl bg-teal-soft text-teal">
            <Construction className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle className="mt-1 font-heading text-lg">
            {feature}
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            This feature is currently in development and will be connected soon.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
