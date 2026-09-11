"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  previewProposalEmail,
  sendProposalEmail,
} from "@/lib/proposals/actions";

function parseAddressList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((addr) => addr.trim())
    .filter(Boolean)
    .filter((addr, index, all) => all.indexOf(addr) === index);
}

export function SendEmailButton({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [loadPending, startLoadTransition] = useTransition();
  const [sendPending, startSendTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");

  function onOpenPreview() {
    startLoadTransition(async () => {
      const result = await previewProposalEmail(proposalId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setTo(result.to);
      setCc("");
      setBcc("");
      setSubject(result.subject);
      setText(result.text);
      setOpen(true);
    });
  }

  function onSend() {
    startSendTransition(async () => {
      const result = await sendProposalEmail(proposalId, {
        subject,
        text,
        cc: parseAddressList(cc),
        bcc: parseAddressList(bcc),
      });
      if (!result.ok) {
        toast.error(result.error);
        setOpen(false);
        router.refresh();
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" onClick={onOpenPreview} disabled={loadPending}>
        {loadPending ? "Loading…" : "Send to client"}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} className="text-left">
        <div className="space-y-4">
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-[var(--koya-ink)]">
              Preview email
            </h2>
            <p className="mt-1 text-sm text-[var(--koya-muted)]">
              Review before sending — add CC/BCC or tweak the wording below.
            </p>
          </div>

          <div className="space-y-2">
            <Label>To</Label>
            <Input value={to} readOnly disabled />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email-cc">Cc</Label>
              <Input
                id="email-cc"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="comma-separated emails"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-bcc">Bcc</Label>
              <Input
                id="email-bcc"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="comma-separated emails"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-body">Body</Label>
            <Textarea
              id="email-body"
              rows={12}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--koya-line)] pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={sendPending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={onSend} disabled={sendPending}>
              {sendPending ? "Sending…" : "Send email"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
