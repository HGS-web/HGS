"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { getSupabaseClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const topicOptions = [
  "Geography: Theory, Methods, Education and Practice",
  "Physical Geography, Climate Change, Coastal Systems and Natural Hazards",
  "Marine, Island and Mediterranean Geographies",
  "Urban Geography, Housing and Trends of Socio-Spatial Inequalities",
  "Demographic Dynamics: Population, Migration and Mobility Flows",
  "Political and Economic Geographies",
  "Cultural Geography, Heritage and Landscapes",
  "Spatial Planning, Regional Development and Territorial Governance",
  "Transport, Mobility and Infrastructure",
  "Geospatial Technologies, Digital and Computational Geographies",
  "Geography and Education – Educating Geographers",
] as const;

const emptyOrganizer = {
  firstName: "",
  lastName: "",
  affiliation: "",
  email: "",
  country: "",
};

type OrganizerState = typeof emptyOrganizer;

interface ThematicSessionFormProps {
  locale: "en" | "el";
}

export function ThematicSessionForm({ locale }: ThematicSessionFormProps) {
  const [organizers, setOrganizers] = React.useState<OrganizerState[]>([
    { ...emptyOrganizer },
  ]);
  const [title, setTitle] = React.useState("");
  const [topic, setTopic] = React.useState<(typeof topicOptions)[number] | "custom">(
    topicOptions[0]
  );
  const [customTopic, setCustomTopic] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [keywords, setKeywords] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [successOpen, setSuccessOpen] = React.useState(false);

  const supabaseClient = React.useMemo(() => getSupabaseClient(), []);

  const wordCount = summary.trim() ? summary.trim().split(/\s+/).length : 0;
  const keywordList = keywords
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const selectedTopic = topic === "custom" ? customTopic : topic;

  const handleOrganizerChange = (
    index: number,
    field: keyof OrganizerState,
    value: string
  ) => {
    setOrganizers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addOrganizer = () => {
    setOrganizers((prev) =>
      prev.length >= 3 ? prev : [...prev, { ...emptyOrganizer }]
    );
  };

  const removeOrganizer = (index: number) => {
    setOrganizers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const resetForm = () => {
    setOrganizers([{ ...emptyOrganizer }]);
    setTitle("");
    setTopic(topicOptions[0]);
    setCustomTopic("");
    setSummary("");
    setKeywords("");
    setComments("");
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setError(null);

    if (!organizers[0].firstName || !organizers[0].lastName || !organizers[0].email) {
      setError("Please complete the required organizer fields.");
      return;
    }

    if (!supabaseClient) {
      setError("Submission is currently unavailable. Please try again later.");
      return;
    }

    if (!title.trim() || !selectedTopic.trim() || !summary.trim()) {
      setError("Please complete the session title, topic, and summary.");
      return;
    }

    if (wordCount > 300) {
      setError("The summary exceeds the 300-word limit.");
      return;
    }

    if (keywordList.length > 5) {
      setError("Please provide up to 5 keywords only.");
      return;
    }

    setIsSubmitting(true);

    const [primary, secondary, tertiary] = organizers;

    const { error: insertError } = await supabaseClient
      .from("thematic_session_submissions_2026")
      .insert({
        locale,
        organizer_primary: primary,
        organizer_secondary: secondary ?? null,
        organizer_tertiary: tertiary ?? null,
        session_title: title.trim(),
        session_topic: selectedTopic.trim(),
        session_summary: summary.trim(),
        session_keywords: keywordList,
        additional_comments: comments.trim() || null,
      });

    setIsSubmitting(false);

    if (insertError) {
      setError("Something went wrong. Please try again later.");
      return;
    }

    setDialogOpen(false);
    setSuccessOpen(true);
    resetForm();
  };

  return (
    <div className="mt-6">
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          setDialogOpen(true);
        }}
      >
        <section className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-black">Organizers</h4>
            <p className="text-sm text-black/60">
              Organizer/Correspondent (required) plus up to two additional organizers.
            </p>
          </div>

          {organizers.map((organizer, index) => (
            <div
              key={`organizer-${index}`}
              className="grid gap-4 rounded-2xl border border-black/10 bg-white/60 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-black">
                  {index === 0 ? "Organizer/Correspondent" : `Organizer ${index + 1}`}
                </p>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeOrganizer(index)}
                    className="text-xs font-medium text-black/50 hover:text-black"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm text-black/70">
                  First name *
                  <input
                    className="rounded-lg border border-black/10 px-3 py-2 text-sm"
                    value={organizer.firstName}
                    onChange={(event) =>
                      handleOrganizerChange(index, "firstName", event.target.value)
                    }
                    required={index === 0}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-black/70">
                  Last name *
                  <input
                    className="rounded-lg border border-black/10 px-3 py-2 text-sm"
                    value={organizer.lastName}
                    onChange={(event) =>
                      handleOrganizerChange(index, "lastName", event.target.value)
                    }
                    required={index === 0}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-black/70">
                  Affiliation
                  <input
                    className="rounded-lg border border-black/10 px-3 py-2 text-sm"
                    value={organizer.affiliation}
                    onChange={(event) =>
                      handleOrganizerChange(index, "affiliation", event.target.value)
                    }
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-black/70">
                  Email *
                  <input
                    type="email"
                    className="rounded-lg border border-black/10 px-3 py-2 text-sm"
                    value={organizer.email}
                    onChange={(event) =>
                      handleOrganizerChange(index, "email", event.target.value)
                    }
                    required={index === 0}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-black/70">
                  Country
                  <input
                    className="rounded-lg border border-black/10 px-3 py-2 text-sm"
                    value={organizer.country}
                    onChange={(event) =>
                      handleOrganizerChange(index, "country", event.target.value)
                    }
                  />
                </label>
              </div>
            </div>
          ))}

          {organizers.length < 3 && (
            <Button type="button" variant="outline" onClick={addOrganizer}>
              Add another organizer
            </Button>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-black">Thematic session details</h4>
            <p className="text-sm text-black/60">
              Provide the thematic session content below.
            </p>
          </div>

          <label className="flex flex-col gap-2 text-sm text-black/70">
            Session title *
            <input
              className="rounded-lg border border-black/10 px-3 py-2 text-sm"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-black/70">
            Topic *
            <select
              className="rounded-lg border border-black/10 px-3 py-2 text-sm"
              value={topic}
              onChange={(event) =>
                setTopic(
                  event.target.value as (typeof topicOptions)[number] | "custom"
                )
              }
              required
            >
              {topicOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value="custom">Custom topic</option>
            </select>
          </label>

          {topic === "custom" && (
            <label className="flex flex-col gap-2 text-sm text-black/70">
              Custom topic *
              <input
                className="rounded-lg border border-black/10 px-3 py-2 text-sm"
                value={customTopic}
                onChange={(event) => setCustomTopic(event.target.value)}
                required
              />
            </label>
          )}

          <label className="flex flex-col gap-2 text-sm text-black/70">
            Summary (max 300 words) *
            <textarea
              className={cn(
                "min-h-[140px] rounded-lg border border-black/10 px-3 py-2 text-sm",
                wordCount > 300 && "border-red-500"
              )}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              required
            />
            <span className={cn("text-xs", wordCount > 300 ? "text-red-500" : "text-black/50")}>
              {wordCount}/300 words
            </span>
          </label>

          <label className="flex flex-col gap-2 text-sm text-black/70">
            Keywords (max 5, separated by comma or new line)
            <textarea
              className={cn(
                "min-h-[80px] rounded-lg border border-black/10 px-3 py-2 text-sm",
                keywordList.length > 5 && "border-red-500"
              )}
              value={keywords}
              onChange={(event) => setKeywords(event.target.value)}
            />
            <span
              className={cn(
                "text-xs",
                keywordList.length > 5 ? "text-red-500" : "text-black/50"
              )}
            >
              {keywordList.length}/5 keywords
            </span>
          </label>

          <label className="flex flex-col gap-2 text-sm text-black/70">
            Additional comments
            <textarea
              className="min-h-[80px] rounded-lg border border-black/10 px-3 py-2 text-sm"
              value={comments}
              onChange={(event) => setComments(event.target.value)}
            />
          </label>
        </section>

        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit thematic session"}
          </Button>
          <p className="text-xs text-black/50">
            You will be asked to confirm before the submission is sent.
          </p>
        </div>
      </form>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-lg">
            <Dialog.Title className="text-lg font-semibold text-black">
              Confirm your submission
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-black/60">
              Please confirm that the details below are correct. The submission will be
              saved in the HGS 2026 conference database.
            </Dialog.Description>
            <div className="mt-4 space-y-2 text-sm text-black/70">
              <p>
                <span className="font-semibold">Session title:</span> {title || "—"}
              </p>
              <p>
                <span className="font-semibold">Topic:</span> {selectedTopic || "—"}
              </p>
              <p>
                <span className="font-semibold">Organizer/Correspondent:</span>{" "}
                {organizers[0].firstName} {organizers[0].lastName}
              </p>
            </div>
            {error && <p className="mt-3 text-sm font-medium text-red-500">{error}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Dialog.Close asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="button" onClick={() => handleSubmit()} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Confirm & Submit"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={successOpen} onOpenChange={setSuccessOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-lg">
            <Dialog.Title className="text-lg font-semibold text-black">
              Submission received
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-black/60">
              Thank you. Your thematic session proposal has been submitted for the HGS
              2026 conference.
            </Dialog.Description>
            <div className="mt-6 flex justify-end">
              <Dialog.Close asChild>
                <Button type="button">Close</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
