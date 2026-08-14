/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  MapPin, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  DollarSign, 
  CheckCircle2, 
  CloudRain,
  HelpCircle,
  Clock
} from 'lucide-react';
import { AIQueryResponse, EnrichedCarpark } from '../types';

interface AIParkingAssistantProps {
  carparks: EnrichedCarpark[];
  onSelectCarpark: (carpark: EnrichedCarpark) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

const PRESET_QUERIES = [
  'Where is the best empty parking near Bugis Junction right now with low rates?',
  'I drive a 2.15m high delivery van near Orchard. Recommend high clearance parking.',
  'Find sheltered parking with active EV charging lots in Marina Bay.',
  'Free Sunday parking near central Singapore or shopping areas.',
  'Visiting Jurong East during peak hours, which MSCP has the most available lots?',
];

export const AIParkingAssistant: React.FC<AIParkingAssistantProps> = ({
  carparks,
  onSelectCarpark,
  userLocation,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (queryText?: string) => {
    const textToSend = queryText || prompt;
    if (!textToSend.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          userLocation,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiResponse(data);
      } else {
        setError(data.details || 'Failed to generate parking recommendation');
      }
    } catch (err) {
      setError('Unable to reach AI assistant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Bento Header */}
      <div className="p-6 rounded-3xl bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-300 border-2 border-zinc-900 flex items-center justify-center text-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
            <Sparkles className="w-6 h-6 text-zinc-900 fill-zinc-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 uppercase tracking-tight">
                SG-PARK AI Smart Advisor
              </h2>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-zinc-900 text-white uppercase tracking-wider">
                Gemini 3.7
              </span>
            </div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
              Live queries on parking availability, rates, gantry heights, and rain shelter.
            </p>
          </div>
        </div>
      </div>

      {/* Query Input Bento Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="relative flex-1">
            <input
              id="input-ai-prompt"
              type="text"
              placeholder="e.g., Where to park near Raffles Place under $3/hr with plenty of lots?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full py-3.5 pl-4 pr-10 rounded-2xl bg-zinc-50 border-2 border-zinc-900 text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
            />
          </div>

          <button
            id="btn-ask-ai"
            type="submit"
            disabled={!prompt.trim() || loading}
            className="py-3.5 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing Lots...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                Ask Advisor
              </>
            )}
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="mt-4 pt-4 border-t-2 border-zinc-100">
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-800" />
            FREQUENT PARKING QUERIES
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_QUERIES.map((q, idx) => (
              <button
                key={idx}
                id={`btn-preset-${idx}`}
                onClick={() => {
                  setPrompt(q);
                  handleSubmit(q);
                }}
                className="py-2 px-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-2 border-zinc-900 text-xs font-bold text-left shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition-all active:translate-x-[1px] active:translate-y-[1px]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-100 border-2 border-rose-500 text-rose-900 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          {error}
        </div>
      )}

      {/* AI Response View Bento Card */}
      {aiResponse && (
        <div className="p-6 rounded-3xl bg-white border-2 border-zinc-900 space-y-5 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <div className="flex items-start gap-3.5 pb-4 border-b-2 border-zinc-100">
            <div className="p-2.5 rounded-2xl bg-zinc-900 text-white border border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                AI RECOMMENDATION SUMMARY
              </span>
              <p className="text-sm font-bold text-zinc-900 mt-1 leading-relaxed">
                {aiResponse.recommendation}
              </p>
            </div>
          </div>

          {/* Recommended Car Park Cards */}
          {aiResponse.recommendedCarparks && aiResponse.recommendedCarparks.length > 0 && (
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">
                TOP SUGGESTED PARKING OPTIONS
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiResponse.recommendedCarparks.map((rec, i) => {
                  const fullMatch = carparks.find((c) => c.carpark_number.toLowerCase() === rec.carpark_number.toLowerCase());
                  return (
                    <div
                      key={i}
                      onClick={() => fullMatch && onSelectCarpark(fullMatch)}
                      className="p-4 rounded-2xl bg-zinc-50 border-2 border-zinc-900 hover:bg-zinc-100 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded-lg bg-zinc-900 text-white font-mono font-black text-xs">
                          {rec.carpark_number}
                        </span>
                        <span className="text-xs font-mono font-black text-emerald-700">
                          {rec.available_lots > 0 ? `${rec.available_lots} empty lots` : 'Check live'}
                        </span>
                      </div>

                      <h5 className="font-black text-zinc-900 group-hover:text-zinc-700 transition-colors text-sm uppercase tracking-tight">
                        {rec.name}
                      </h5>

                      <p className="text-xs font-semibold text-zinc-600 mt-1">
                        {rec.reason}
                      </p>

                      <div className="mt-3 pt-2 border-t border-zinc-200 flex items-center justify-between text-[11px] text-zinc-500 font-bold">
                        <span>{rec.rate_info}</span>
                        <span className="text-zinc-900 font-black uppercase text-[10px] group-hover:underline flex items-center gap-1">
                          View details →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tips and Weather Advisory */}
          {aiResponse.tips && aiResponse.tips.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-50 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
              <h5 className="text-xs font-black uppercase text-zinc-900 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Local Driver Tips
              </h5>
              <ul className="space-y-1 text-xs font-semibold text-zinc-600 list-disc list-inside">
                {aiResponse.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
