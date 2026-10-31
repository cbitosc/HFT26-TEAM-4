"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Zap,
  Globe,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Building2,
  FileCheck,
  RefreshCw,
  Clock,
  KeyRound,
  FileText,
  User,
  Phone,
  Link2,
  Briefcase,
  GraduationCap,
  Wrench,
  Check,
  X,
} from "lucide-react";
import { useResumeStore } from "@/lib/store/useResumeStore";
import {
  FormField,
  FormFieldCategory,
  FormProvider,
  ParsedForm,
  FormSubmissionReceipt,
} from "@/lib/form/formTypes";
import {
  autoFillFormFields,
  validateFilledForm,
} from "@/lib/form/formAutoFiller";
import { getAvailablePresets, getPresetForm } from "@/lib/form/formParser";

interface FormAutoFillViewProps {
  onSwitchToCanvas?: () => void;
}

const CATEGORY_META: Record<
  FormFieldCategory,
  { label: string; icon: React.ReactNode; color: string }
> = {
  personal: {
    label: "Personal & Identity",
    icon: <User className="w-3.5 h-3.5" />,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  contact: {
    label: "Contact Information",
    icon: <Phone className="w-3.5 h-3.5" />,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  links: {
    label: "Social & Portfolio Links",
    icon: <Link2 className="w-3.5 h-3.5" />,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  experience: {
    label: "Work Experience",
    icon: <Briefcase className="w-3.5 h-3.5" />,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  education: {
    label: "Education & Degrees",
    icon: <GraduationCap className="w-3.5 h-3.5" />,
    color: "text-teal-500 bg-teal-500/10 border-teal-500/20",
  },
  skills: {
    label: "Skills & Proficiencies",
    icon: <Wrench className="w-3.5 h-3.5" />,
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  },
  cover_letter: {
    label: "Cover Letter & Notes",
    icon: <FileText className="w-3.5 h-3.5" />,
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  },
  custom: {
    label: "Application Questions",
    icon: <Sparkles className="w-3.5 h-3.5" />,
    color: "text-slate-500 bg-slate-500/10 border-slate-500/20",
  },
};

export const FormAutoFillView: React.FC<FormAutoFillViewProps> = ({
  onSwitchToCanvas,
}) => {
  const { resume } = useResumeStore();

  const [formUrl, setFormUrl] = useState("https://boards.greenhouse.io/techcorp/jobs/4829102");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedForm, setParsedForm] = useState<ParsedForm | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [submissionReceipt, setSubmissionReceipt] =
    useState<FormSubmissionReceipt | null>(null);
  const [validationError, setValidationError] = useState<string[] | null>(null);

  const presets = useMemo(() => getAvailablePresets(), []);

  // Initialize with Greenhouse preset on mount
  useEffect(() => {
    const initialPreset = getPresetForm("greenhouse");
    setParsedForm(initialPreset);
    const filled = autoFillFormFields(initialPreset.fields, resume);
    setFields(filled);
    setLastSyncTime(new Date().toLocaleTimeString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ⚡ LIVE RESUME RE-SYNC:
  // When the user edits anything in the left-hand resume editor (resume updates),
  // instantly update all non-overridden form fields in real time!
  useEffect(() => {
    setFields((prev) => {
      if (prev.length === 0) return prev;
      const updated = autoFillFormFields(prev, resume);
      return updated;
    });
    setLastSyncTime(new Date().toLocaleTimeString());
  }, [resume]);

  // Handle URL Fetch & Parse
  const handleFetchForm = async (targetUrl?: string) => {
    const urlToFetch = targetUrl || formUrl;
    if (!urlToFetch || !urlToFetch.trim()) {
      setError("Please provide a valid application form URL.");
      return;
    }

    setLoading(true);
    setError(null);
    setValidationError(null);
    setSubmissionReceipt(null);

    try {
      const res = await fetch("/api/parse-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToFetch.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch and parse application form.");
      }

      const form: ParsedForm = data.form;
      setParsedForm(form);
      const autoFilled = autoFillFormFields(form.fields, resume);
      setFields(autoFilled);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Preset quick load
  const handleSelectPreset = (presetId: FormProvider, sampleUrl: string) => {
    setFormUrl(sampleUrl);
    setError(null);
    setValidationError(null);
    setSubmissionReceipt(null);
    const presetForm = getPresetForm(presetId, sampleUrl);
    setParsedForm(presetForm);
    const autoFilled = autoFillFormFields(presetForm.fields, resume);
    setFields(autoFilled);
    setLastSyncTime(new Date().toLocaleTimeString());
  };

  // Update a single form field value
  const handleFieldChange = (id: string, newValue: string) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, value: newValue, isUserModified: true } : f
      )
    );
  };

  // Revert a customized field back to live resume sync
  const handleResetField = (id: string) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const resetField = { ...f, isUserModified: false };
          const filled = autoFillFormFields([resetField], resume);
          return filled[0] || resetField;
        }
        return f;
      })
    );
  };

  // Submit Application Form
  const handleSubmitForm = async () => {
    if (!parsedForm) return;

    // Validate required fields
    const validation = validateFilledForm(fields);
    if (!validation.isValid) {
      setValidationError(validation.missingRequired);
      return;
    }

    setValidationError(null);
    setSubmitting(true);

    try {
      const payload: Record<string, string> = {};
      fields.forEach((f) => {
        payload[f.name || f.id] = f.value;
      });

      const res = await fetch("/api/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formUrl: parsedForm.url,
          formTitle: parsedForm.title,
          provider: parsedForm.provider,
          payload,
        }),
      });

      const receipt: FormSubmissionReceipt = await res.json();
      if (!res.ok || !receipt.success) {
        throw new Error(receipt.message || "Failed to submit application.");
      }

      setSubmissionReceipt(receipt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Group fields by category
  const groupedFields = useMemo(() => {
    const groups: Partial<Record<FormFieldCategory, FormField[]>> = {};
    for (const field of fields) {
      const cat = field.category || "custom";
      if (!groups[cat]) groups[cat] = [];
      groups[cat]!.push(field);
    }
    return groups;
  }, [fields]);

  // Statistics
  const filledCount = useMemo(() => {
    return fields.filter((f) => f.value && f.value.trim().length > 0).length;
  }, [fields]);

  const matchPercentage = useMemo(() => {
    if (fields.length === 0) return 0;
    return Math.round((filledCount / fields.length) * 100);
  }, [filledCount, fields.length]);

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-obsidian-950 overflow-y-auto">
      {/* Top Banner: URL Bar & Preset Chips */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/[0.08] bg-white dark:bg-obsidian-900/60 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Live Form Auto-Filler</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 animate-pulse">
                    ⚡ Live Synced with Resume Editor
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Paste any job application or ATS URL. Changes in your resume update the form live.
                </p>
              </div>
            </div>

            {onSwitchToCanvas && (
              <button
                type="button"
                onClick={onSwitchToCanvas}
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-obsidian-850 hover:bg-slate-200 dark:hover:bg-obsidian-800 text-xs text-slate-700 dark:text-slate-300 transition"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Return to Canvas</span>
              </button>
            )}
          </div>

          {/* Form URL Input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFetchForm();
                }}
                placeholder="Paste application form URL (e.g. Greenhouse, Lever, Google Form, Workday)..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-obsidian-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <button
              type="button"
              onClick={() => handleFetchForm()}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition disabled:opacity-50 shadow-glow-emerald shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Parsing Form..." : "AutoFill Form"}</span>
            </button>
          </div>

          {/* Preset Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1 font-medium">
              Quick Test:
            </span>
            {presets.map((p) => {
              const isActive = parsedForm?.provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id, p.sampleUrl)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border flex items-center space-x-1 ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-xs"
                      : "bg-slate-100 dark:bg-obsidian-850 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-obsidian-800"
                  }`}
                >
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <p className="font-bold">Error reading application form</p>
              <p className="mt-0.5 text-slate-600 dark:text-slate-300">{error}</p>
            </div>
          </div>
        )}

        {/* Validation Warning Alert */}
        {validationError && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="font-bold">Please fill required fields before submitting:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 font-mono text-[11px]">
                {validationError.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Form Overview Card */}
        {parsedForm && (
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-obsidian-900 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-obsidian-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06]">
                    {parsedForm.provider.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    Method: {parsedForm.method}
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {parsedForm.title}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xl">
                  Target: {parsedForm.url}
                </p>
              </div>

              {/* Live Match Badge */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {filledCount} / {fields.length} Filled ({matchPercentage}%)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Last synched: {lastSyncTime}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-emerald-500/10 text-emerald-500 font-bold text-xs font-mono">
                  {matchPercentage}%
                </div>
              </div>
            </div>

            {/* Live Synchronisation Indicator Note */}
            <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-medium text-[11px] sm:text-xs">
                  Active Two-Way Sync: Editing your resume in the left panel dynamically updates these fields live!
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const autoFilled = autoFillFormFields(fields, resume);
                  setFields(autoFilled);
                  setLastSyncTime(new Date().toLocaleTimeString());
                }}
                className="text-[10px] text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 shrink-0 ml-2"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Force Re-sync</span>
              </button>
            </div>
          </div>
        )}

        {/* Grouped Field Cards */}
        <div className="space-y-6">
          {(Object.keys(groupedFields) as FormFieldCategory[]).map((category) => {
            const categoryFields = groupedFields[category] || [];
            if (categoryFields.length === 0) return null;
            const meta = CATEGORY_META[category] || CATEGORY_META.custom;

            return (
              <div
                key={category}
                className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-obsidian-900 overflow-hidden shadow-xs"
              >
                {/* Category Header */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-obsidian-850/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`p-1 rounded-md border text-xs font-semibold flex items-center gap-1.5 ${meta.color}`}
                    >
                      {meta.icon}
                      <span>{meta.label}</span>
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ({categoryFields.length} {categoryFields.length === 1 ? "field" : "fields"})
                    </span>
                  </div>
                </div>

                {/* Field Inputs */}
                <div className="p-4 sm:p-5 space-y-4">
                  {categoryFields.map((field) => {
                    const isOverridden = field.isUserModified;
                    const isFilled = Boolean(field.value && field.value.trim());

                    return (
                      <div
                        key={field.id}
                        className="space-y-1.5 p-3 rounded-xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/40 dark:bg-obsidian-950/40 hover:border-slate-200 dark:hover:border-white/[0.08] transition"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <label
                            htmlFor={`field-${field.id}`}
                            className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                          >
                            <span>{field.label}</span>
                            {field.required && (
                              <span
                                className="text-rose-500 font-bold"
                                title="Required Field"
                              >
                                *
                              </span>
                            )}
                          </label>

                          {/* Provenance Badge & Actions */}
                          <div className="flex items-center gap-1.5">
                            {isOverridden ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 flex items-center gap-1">
                                  <span>✏️ Custom Override</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleResetField(field.id)}
                                  title="Reset to resume value & restore live sync"
                                  className="text-[10px] text-slate-400 hover:text-emerald-500 p-0.5"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                  isFilled
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                                    : "bg-slate-100 dark:bg-obsidian-800 text-slate-500 border-slate-200 dark:border-white/[0.06]"
                                }`}
                              >
                                {isFilled ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                                    <span>{field.sourceFieldLabel}</span>
                                  </>
                                ) : (
                                  <span>Unmapped</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Input Control */}
                        {field.type === "textarea" ? (
                          <textarea
                            id={`field-${field.id}`}
                            rows={3}
                            value={field.value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label}...`}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-obsidian-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          />
                        ) : field.type === "select" && field.options && field.options.length > 0 ? (
                          <select
                            id={`field-${field.id}`}
                            value={field.value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-obsidian-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          >
                            {field.options.map((opt, i) => (
                              <option key={i} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "file" ? (
                          <div className="flex items-center justify-between p-2.5 rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/5 text-xs text-slate-700 dark:text-slate-300">
                            <div className="flex items-center space-x-2">
                              <FileCheck className="w-4 h-4 text-emerald-500" />
                              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                {field.value || "ATS_Clean_Vector_Resume.pdf"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                (Generated dynamically from active resume)
                              </span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                              Ready for Dispatch
                            </span>
                          </div>
                        ) : (
                          <input
                            id={`field-${field.id}`}
                            type={field.type}
                            value={field.value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label}...`}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-obsidian-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button Section: Submit Application */}
        {parsedForm && (
          <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-white/90 dark:bg-obsidian-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/[0.1] shadow-glass-elevated flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Ready to Submit Application</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                All values are validated and grounded in your career profile data.
              </p>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSubmitForm}
                disabled={submitting || fields.length === 0}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-glow-emerald disabled:opacity-50"
              >
                <Send className={`w-4 h-4 ${submitting ? "animate-spin" : ""}`} />
                <span>{submitting ? "Dispatching Application..." : "Submit Application Form"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submission Receipt Modal */}
      {submissionReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/[0.1] shadow-glass-elevated p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Application Submitted!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Candidate transmission receipt generated
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSubmissionReceipt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 dark:text-emerald-200">
                <p className="font-semibold">{submissionReceipt.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-obsidian-950 border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block font-mono">
                    CONFIRMATION ID
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    {submissionReceipt.confirmationId}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-obsidian-950 border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block font-mono">
                    SUBMISSION TIMESTAMP
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">
                    {new Date(submissionReceipt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-obsidian-950 border border-slate-200 dark:border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block font-mono">
                  TARGET DESTINATION
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block truncate">
                  {submissionReceipt.formTitle}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block truncate">
                  {submissionReceipt.formUrl}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block">
                  SUBMITTED PAYLOAD SUMMARY ({Object.keys(submissionReceipt.submittedPayload).length} fields):
                </span>
                <div className="max-h-36 overflow-y-auto p-2 rounded-lg bg-slate-100 dark:bg-obsidian-950 font-mono text-[10px] space-y-1 border border-slate-200 dark:border-white/[0.06]">
                  {Object.entries(submissionReceipt.submittedPayload).map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-2 border-b border-white/[0.04] pb-0.5">
                      <span className="text-slate-500 shrink-0">{k}:</span>
                      <span className="text-emerald-600 dark:text-emerald-300 text-right truncate">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSubmissionReceipt(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-obsidian-950 font-bold text-xs hover:opacity-90 transition"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormAutoFillView;
