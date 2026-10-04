import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <Loader2 className="size-8 animate-spin text-navy/50" />
    </div>
  );
}