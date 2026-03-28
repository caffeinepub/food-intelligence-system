import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  History,
  LayoutDashboard,
  Loader2,
  Save,
  Scan,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { FoodAnalysis } from "./backend";
import { AnalysisResults } from "./components/AnalysisResults";
import { type ChatMessage, ChatSection } from "./components/ChatSection";
import { HistoryPanel } from "./components/HistoryPanel";
import { NavBar } from "./components/NavBar";
import { UploadZone } from "./components/UploadZone";
import { useActor } from "./hooks/useActor";

function playSuccessChime() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.12 + 0.4,
      );
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.4);
    });
  } catch {
    // Audio not available
  }
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("food-theme") as "dark" | "light") || "dark";
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);

  const { actor } = useActor();

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("food-theme", theme);
  }, [theme]);

  // Ensure dark mode on first load
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleFileSelect = useCallback((file: File) => {
    setUploadError(null);
    setAnalysis(null);
    setSavedToHistory(false);
    setChatMessages([]);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError(
        "Invalid file type. Please upload JPG, PNG, or WEBP images only.",
      );
      toast.error("Invalid file type");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 10MB.");
      toast.error("File too large");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }, []);

  const handleClear = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedFile(null);
    setImagePreview(null);
    setUploadError(null);
    setAnalysis(null);
    setSavedToHistory(false);
    setChatMessages([]);
  }, [imagePreview]);

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }
    if (!actor) {
      toast.error("Backend not ready. Please wait.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setChatMessages([]);
    setSavedToHistory(false);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const imageSize = BigInt(arrayBuffer.byteLength);
      const result = await actor.analyzeFood(imageSize, "");
      setAnalysis(result);

      // Add initial AI response to chat
      if (result.aiResponse) {
        setChatMessages([
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: result.aiResponse,
            timestamp: new Date(),
          },
        ]);
      }

      playSuccessChime();
      toast.success(`Analysis complete: ${result.foodName} detected!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!analysis || !actor || savedToHistory) return;
    try {
      await actor.saveAnalysis(
        analysis.foodName,
        analysis.freshnessLabel,
        analysis.confidencePercent,
        null,
      );
      setSavedToHistory(true);
      toast.success("Saved to history!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    }
  };

  const handleChatSend = async (message: string) => {
    if (!actor) {
      toast.error("Backend not ready");
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const imageSize = selectedFile
        ? BigInt((await selectedFile.arrayBuffer()).byteLength)
        : BigInt(0);
      const result = await actor.analyzeFood(imageSize, message);
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          result.aiResponse || result.statusMessage || "Analysis complete.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get response";
      toast.error(msg);
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === "history") {
      setActiveTab("history");
    } else {
      setActiveTab("dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 neon-text-purple" />
            <span className="text-sm text-muted-foreground uppercase tracking-widest">
              AI-Powered Analysis
            </span>
            <Sparkles className="w-5 h-5 neon-text-cyan" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Food Intelligence <span className="neon-text-cyan">Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Upload a food image for AI-powered freshness detection,
            classification, and nutritional insights
          </p>
        </motion.div>

        {/* Tab navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList
            className="grid w-full max-w-sm mx-auto grid-cols-2"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <TabsTrigger
              data-ocid="dashboard.tab"
              value="dashboard"
              className="data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan"
            >
              <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              data-ocid="history.tab"
              value="history"
              className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple"
            >
              <History className="w-3.5 h-3.5 mr-1.5" />
              History
            </TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Section 1: Upload + Quick Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: "oklch(0.78 0.12 210 / 0.15)",
                      border: "1px solid oklch(0.78 0.12 210 / 0.3)",
                    }}
                  >
                    <Scan className="w-4 h-4 neon-text-cyan" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Image Upload</h2>
                    <p className="text-xs text-muted-foreground">
                      Drag & drop or browse to upload
                    </p>
                  </div>
                </div>

                <UploadZone
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  imagePreview={imagePreview}
                  onClear={handleClear}
                  error={uploadError}
                />

                <Button
                  data-ocid="analyze.primary_button"
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isAnalyzing}
                  className="w-full h-11 bg-gradient-to-r from-neon-cyan/30 to-neon-purple/30 text-foreground border border-neon-cyan/40 hover:from-neon-cyan/40 hover:to-neon-purple/40 font-semibold disabled:opacity-40"
                  variant="outline"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing food intelligence...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze Food
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Quick Results Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card-purple rounded-2xl p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: "oklch(0.64 0.24 300 / 0.15)",
                      border: "1px solid oklch(0.64 0.24 300 / 0.3)",
                    }}
                  >
                    <Sparkles className="w-4 h-4 neon-text-purple" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">AI Food Analysis</h2>
                    <p className="text-xs text-muted-foreground">
                      Results powered by MobileNetV2
                    </p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {isAnalyzing ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      data-ocid="analysis.loading_state"
                      className="flex flex-col items-center justify-center py-16 gap-4"
                    >
                      <div className="relative">
                        <div
                          className="w-16 h-16 rounded-full border-2 border-t-neon-cyan border-neon-cyan/20 animate-spin"
                          style={{ borderTopColor: "oklch(0.78 0.12 210)" }}
                        />
                        <div
                          className="absolute inset-2 rounded-full border-2 border-b-neon-purple border-neon-purple/20 animate-spin"
                          style={{
                            animationDirection: "reverse",
                            borderBottomColor: "oklch(0.64 0.24 300)",
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold neon-text-cyan">
                          Analyzing food intelligence...
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Processing with deep learning model
                        </p>
                      </div>
                    </motion.div>
                  ) : analysis ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      data-ocid="analysis.success_state"
                    >
                      <AnalysisResults analysis={analysis} compact />
                      {!savedToHistory && (
                        <Button
                          data-ocid="analysis.save.button"
                          variant="outline"
                          size="sm"
                          onClick={handleSaveToHistory}
                          className="mt-4 w-full border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10"
                        >
                          <Save className="w-3.5 h-3.5 mr-1.5" />
                          Save to History
                        </Button>
                      )}
                      {savedToHistory && (
                        <p className="text-xs text-neon-green text-center mt-3">
                          ✓ Saved to history
                        </p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      data-ocid="analysis.empty_state"
                      className="flex flex-col items-center justify-center py-16 text-center gap-3"
                    >
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{
                          background: "oklch(0.64 0.24 300 / 0.1)",
                          border: "1px solid oklch(0.64 0.24 300 / 0.2)",
                        }}
                      >
                        <Scan className="w-7 h-7 neon-text-purple" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground/70">
                          No analysis yet
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Upload an image and click Analyze
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Section 2: Large Preview + Detailed Results (post-analysis) */}
            <AnimatePresence>
              {analysis && imagePreview && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.4 }}
                  data-ocid="detailed.panel"
                  className="glass-card rounded-2xl p-6"
                >
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 neon-text-cyan" />
                    Detailed Analysis
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Image */}
                    <div className="flex items-center justify-center">
                      <img
                        src={imagePreview}
                        alt="Food analysis"
                        className="w-full max-h-80 object-contain rounded-2xl image-glow"
                      />
                    </div>
                    {/* Detailed results */}
                    <AnalysisResults analysis={analysis} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Section 3: Chat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <div
                className="px-6 py-4 flex items-center gap-2"
                style={{ borderBottom: "1px solid var(--glass-border)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: "oklch(0.78 0.12 210 / 0.15)",
                    border: "1px solid oklch(0.78 0.12 210 / 0.3)",
                  }}
                >
                  <Sparkles className="w-4 h-4 neon-text-cyan" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Insights & Chat</h2>
                  <p className="text-xs text-muted-foreground">
                    Multi-modal analysis with text + image context
                  </p>
                </div>
              </div>
              <ChatSection
                messages={chatMessages}
                onSend={handleChatSend}
                isLoading={isChatLoading}
              />
            </motion.div>
          </TabsContent>

          {/* HISTORY */}
          <TabsContent value="history" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <HistoryPanel />
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer
        className="mt-16 border-t"
        style={{ borderColor: "var(--glass-border)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="neon-text-cyan font-semibold">MFIS</span>
            <span>·</span>
            <span>Multi-Modal Food Intelligence System</span>
          </div>
          <div className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="neon-text-cyan hover:underline"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            backdropFilter: "blur(16px)",
          },
        }}
      />
    </div>
  );
}
