import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingUp, XCircle, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { FoodAnalysis } from "../backend";

interface AnalysisResultsProps {
  analysis: FoodAnalysis;
  compact?: boolean;
}

export function AnalysisResults({
  analysis,
  compact = false,
}: AnalysisResultsProps) {
  const isFresh = analysis.freshnessLabel.toLowerCase().includes("fresh");
  const confidence = Number(analysis.confidencePercent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-4"
    >
      {/* Food name + freshness */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
              Identified Food
            </p>
            <h2
              className={cn(
                "font-bold leading-tight",
                compact ? "text-2xl" : "text-3xl sm:text-4xl",
              )}
            >
              {analysis.foodName}
            </h2>
          </div>
          <Badge
            className={cn(
              "text-sm font-semibold px-3 py-1.5 border-0 shrink-0 mt-1",
              isFresh
                ? "bg-neon-green/20 text-neon-green"
                : "bg-neon-red/20 text-neon-red",
            )}
          >
            {isFresh ? (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
            )}
            {analysis.freshnessLabel}
          </Badge>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 neon-text-cyan" />
            <span className="text-sm font-medium text-muted-foreground">
              Confidence
            </span>
          </div>
          <span className="text-lg font-bold neon-text-cyan">
            {confidence}%
          </span>
        </div>
        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{ background: "oklch(0.78 0.12 210 / 0.1)" }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="h-full rounded-full progress-bar-cyan"
          />
        </div>
      </div>

      {/* Status message */}
      {analysis.statusMessage && (
        <div
          className="rounded-lg px-3 py-2.5 text-sm"
          style={{
            background: "oklch(0.78 0.12 210 / 0.08)",
            border: "1px solid oklch(0.78 0.12 210 / 0.2)",
          }}
        >
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 neon-text-cyan shrink-0 mt-0.5" />
            <p className="text-foreground/80">{analysis.statusMessage}</p>
          </div>
        </div>
      )}

      {/* Top predictions */}
      {analysis.topPredictions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Top Predictions
          </p>
          {analysis.topPredictions.slice(0, 3).map((pred, i) => {
            const conf = Number(pred.confidence);
            return (
              <motion.div
                key={pred.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                data-ocid={`prediction.item.${i + 1}`}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground/90 truncate pr-2">
                    {pred.name}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {conf}%
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "oklch(0.64 0.24 300 / 0.1)" }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${conf}%` }}
                    transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                    className="h-full rounded-full"
                    style={{
                      background:
                        i === 0
                          ? "linear-gradient(90deg, oklch(0.78 0.12 210), oklch(0.64 0.24 300))"
                          : i === 1
                            ? "linear-gradient(90deg, oklch(0.64 0.24 300), oklch(0.63 0.25 325))"
                            : "oklch(0.78 0.12 210 / 0.5)",
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
