import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Bot, Loader2, Mic, MicOff, Send, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSectionProps {
  messages: ChatMessage[];
  onSend: (message: string) => Promise<void>;
  isLoading: boolean;
}

export function ChatSection({ messages, onSend, isLoading }: ChatSectionProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message/loading change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput("");
    await onSend(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMic = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput((prev) => prev + transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const hasSpeechAPI =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition);

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        data-ocid="chat.panel"
        className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar-thin"
        style={{ maxHeight: "380px", minHeight: "200px" }}
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              data-ocid="chat.empty_state"
              className="flex flex-col items-center justify-center h-32 text-center"
            >
              <Bot className="w-10 h-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                Ask anything about your food analysis
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                e.g., "Is this safe to eat?" or "What nutrients does it
                contain?"
              </p>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              data-ocid={`chat.item.${i + 1}`}
              className={cn(
                "flex gap-3 max-w-[90%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : "",
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold",
                  msg.role === "assistant"
                    ? "bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 border border-neon-cyan/40"
                    : "bg-neon-purple/20 border border-neon-purple/40",
                )}
              >
                {msg.role === "assistant" ? (
                  <Bot className="w-3.5 h-3.5 neon-text-cyan" />
                ) : (
                  <User className="w-3.5 h-3.5 neon-text-purple" />
                )}
              </div>
              <div
                className={cn(
                  "px-4 py-3 text-sm leading-relaxed max-w-full",
                  msg.role === "assistant"
                    ? "chat-bubble-ai"
                    : "chat-bubble-user",
                )}
              >
                {msg.content}
                <div
                  className={cn(
                    "text-xs mt-1.5 opacity-50",
                    msg.role === "user" ? "text-right" : "",
                  )}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              data-ocid="chat.loading_state"
              className="flex gap-3"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 border border-neon-cyan/40">
                <Bot className="w-3.5 h-3.5 neon-text-cyan" />
              </div>
              <div className="chat-bubble-ai px-4 py-3">
                <div className="flex gap-1.5 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="typing-dot w-2 h-2 rounded-full bg-neon-cyan"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 pt-0">
        <div
          className="flex gap-2 rounded-xl p-1"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <Input
            data-ocid="chat.input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoading ? "AI is thinking..." : "Ask about this food..."
            }
            disabled={isLoading}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-sm placeholder:text-muted-foreground/60"
          />
          {hasSpeechAPI && (
            <Button
              data-ocid="chat.mic.button"
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleMic}
              className={cn(
                "shrink-0 w-9 h-9 rounded-lg transition-all",
                isListening
                  ? "text-neon-red bg-neon-red/10 animate-pulse"
                  : "text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10",
              )}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          )}
          <Button
            data-ocid="chat.send.button"
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0 w-9 h-9 rounded-lg bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/30 disabled:opacity-40"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
