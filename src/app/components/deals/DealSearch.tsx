"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadRecentSearches,
  saveRecentSearch,
  SEARCH_PLACEHOLDERS,
  STORE_SEARCH_HINTS,
  TRENDING_SEARCHES,
} from "@/lib/deal-ui";

export default function DealSearch({
  value,
  onChange,
  activeStore,
}: {
  value: string;
  onChange: (v: string) => void;
  activeStore?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const storePlaceholders =
    activeStore && activeStore !== "Alla" ? STORE_SEARCH_HINTS[activeStore] ?? null : null;
  const [recent, setRecent] = useState<string[]>(() => loadRecentSearches());
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (term: string) => {
    onChange(term);
    saveRecentSearch(term);
    setRecent(loadRecentSearches());
    setFocused(false);
  };

  const showSuggestions = focused && !value.trim();

  return (
    <div className="search-wrap" ref={wrapRef}>
      <span className="search-icon" aria-hidden>
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) saveRecentSearch(value);
        }}
        placeholder={
          storePlaceholders
            ? storePlaceholders[placeholderIdx % storePlaceholders.length]
            : SEARCH_PLACEHOLDERS[placeholderIdx]
        }
        className="search-input mobile-search"
        aria-label="Sök deals"
        autoComplete="off"
      />
      {showSuggestions && (
        <div className="search-suggestions">
          {recent.length > 0 && (
            <>
              <p className="search-suggestions-label">Senaste sökningar</p>
              {recent.map((term) => (
                <button
                  key={`r-${term}`}
                  type="button"
                  className="search-chip"
                  onClick={() => pick(term)}
                >
                  {term}
                </button>
              ))}
            </>
          )}
          <p className="search-suggestions-label">Trendar nu</p>
          {TRENDING_SEARCHES.map((term) => (
            <button
              key={`t-${term}`}
              type="button"
              className="search-chip"
              onClick={() => pick(term)}
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
