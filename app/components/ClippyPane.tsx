"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";

export const CLIPPY_QUOTES = [
  "Haha! Excellent point!",
  "I'm going to say... you're correct!",
  "Zero galons of water were used in this pointless response!",
  "Probably not... but Clippy believes in you!",
  "My real names Tony but... nobody cares about the man underneath the metal.",
  "It's'a me! Clippy!",
] as const;

class QuoteDeck {
  private pool: number[] = [];
  private lastPicked: number | null = null;

  constructor(private readonly size: number) {
    this.reset();
  }

  private reset() {
    const deck = Array.from({ length: this.size }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    // Prevent repeating the same quote across deck boundaries
    if (this.lastPicked !== null && deck[0] === this.lastPicked && deck.length > 1) {
      [deck[0], deck[1]] = [deck[1], deck[0]];
    }
    this.pool = deck;
  }

  public next(): number {
    if (this.pool.length === 0) {
      this.reset();
    }
    const picked = this.pool.shift() ?? 0;
    this.lastPicked = picked;
    return picked;
  }
}

export function ClippyPane() {
  const [currentQuote, setCurrentQuote] = useState<string>(
    "It looks like you're browsing alexhastech.dev! Would you like help or questionable advice?"
  );
  const [inputMessage, setInputMessage] = useState("");
  const [talkCount, setTalkCount] = useState(0);
  const deckRef = useRef<QuoteDeck | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    deckRef.current = new QuoteDeck(CLIPPY_QUOTES.length);
  }, []);

  const triggerNextQuote = useCallback(() => {
    if (!deckRef.current) {
      deckRef.current = new QuoteDeck(CLIPPY_QUOTES.length);
    }
    const nextIdx = deckRef.current.next();
    setCurrentQuote(CLIPPY_QUOTES[nextIdx]);
    setTalkCount((prev) => prev + 1);
  }, []);

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    triggerNextQuote();
    setInputMessage("");
  };

  return (
    <div className="clippy-pane">
      <div className="clippy-stage">
        <div className="clippy-character">
          <button
            type="button"
            className="clippy-avatar-btn"
            onClick={triggerNextQuote}
            aria-label="Click Clippy to get advice"
            title="Click Clippy for advice"
          >
            <img
              src="/images/clippy.gif"
              alt="Clippy — ChatGPT's Grandad"
              width={140}
              height={140}
              className="clippy-sprite"
            />
          </button>
        </div>

        <div
          className="clippy-speech-bubble"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="clippy-bubble-header">
            <span className="clippy-bubble-title">Office Assistant</span>
            <span className="clippy-bubble-badge">v1.0 (1997)</span>
          </div>
          <p className="clippy-bubble-text">{currentQuote}</p>
        </div>
      </div>

      <div className="clippy-controls bevel-out">
        <div className="clippy-quick-prompts">
          <span className="clippy-prompts-label">Quick talk:</span>
          <button
            type="button"
            className="bevel-out clippy-quick-btn"
            onClick={triggerNextQuote}
          >
            Ask for wisdom
          </button>
          <button
            type="button"
            className="bevel-out clippy-quick-btn"
            onClick={triggerNextQuote}
          >
            Say hello
          </button>
          <button
            type="button"
            className="bevel-out clippy-quick-btn"
            onClick={triggerNextQuote}
          >
            Is AI taking my job?
          </button>
        </div>

        <form className="clippy-input-row" onSubmit={handleFormSubmit}>
          <label htmlFor="clippy-talk-input" className="sr-only">
            Talk with ChatGPT's Grandad
          </label>
          <input
            id="clippy-talk-input"
            ref={inputRef}
            type="text"
            className="clippy-text-input bevel-in"
            placeholder="Type anything to talk with Clippy..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button type="submit" className="bevel-out clippy-submit-btn">
            TALK
          </button>
        </form>
      </div>

      <div className="clippy-footer-note">
        <span className="clippy-counter">Wisdom dispensed: {talkCount}</span>
        <span className="clippy-disclaimer">Zero GPUs or LLM tokens harmed in this computation.</span>
      </div>
    </div>
  );
}
