import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Clock, Loader2, RefreshCw, XCircle } from "lucide-react";
import { motion } from "motion/react";
import type { HistoryRecord } from "../backend";
import { useGetHistory } from "../hooks/useQueries";

function formatTime(timestamp: bigint) {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryPanel() {
  const { data: history, isLoading, refetch } = useGetHistory();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Analysis History</h3>
          <p className="text-sm text-muted-foreground">
            Recent food analysis results
          </p>
        </div>
        <Button
          data-ocid="history.refresh.button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5 border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div
          data-ocid="history.loading_state"
          className="flex items-center justify-center py-16"
        >
          <Loader2 className="w-8 h-8 animate-spin neon-text-cyan" />
        </div>
      ) : !history || history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-ocid="history.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Clock className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No analysis history yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Upload and analyze a food image to get started
          </p>
        </motion.div>
      ) : (
        <ScrollArea className="h-[500px] pr-2">
          <div className="space-y-3" data-ocid="history.list">
            {history.map((record: HistoryRecord, i: number) => {
              const isFresh = record.freshnessLabel
                .toLowerCase()
                .includes("fresh");
              const confidence = Number(record.confidencePercent);
              return (
                <motion.div
                  key={String(record.id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  data-ocid={`history.item.${i + 1}`}
                  className="glass-card rounded-xl p-4 flex items-center gap-4"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: isFresh
                        ? "oklch(0.72 0.18 145 / 0.15)"
                        : "oklch(0.63 0.23 25 / 0.15)",
                      border: `1px solid ${isFresh ? "oklch(0.72 0.18 145 / 0.4)" : "oklch(0.63 0.23 25 / 0.4)"}`,
                    }}
                  >
                    {isFresh ? (
                      <CheckCircle2 className="w-5 h-5 text-neon-green" />
                    ) : (
                      <XCircle className="w-5 h-5 text-neon-red" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">
                        {record.foodName}
                      </p>
                      <Badge
                        className={cn(
                          "text-xs shrink-0",
                          isFresh
                            ? "bg-neon-green/15 text-neon-green border-0"
                            : "bg-neon-red/15 text-neon-red border-0",
                        )}
                      >
                        {record.freshnessLabel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(record.timestamp)}
                      </span>
                      <span className="text-xs neon-text-cyan">
                        {confidence}% confidence
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold neon-text-cyan">
                      {confidence}%
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
