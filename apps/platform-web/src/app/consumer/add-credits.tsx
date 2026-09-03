"use client";

import { formatUsd } from "@galleon/contracts";
import { Button, Dialog, Field, PriceField } from "@galleon/ui";
import { useState, useTransition } from "react";

import { addCredits } from "./actions";

const PRESETS = [1000, 2500, 5000]; // $10 / $25 / $50, in minor units

function parseMinor(raw: string): number | null {
  const t = raw.trim();
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(t)) return null;
  const minor = Math.round(Number.parseFloat(t) * 100);
  return Number.isInteger(minor) ? minor : null;
}

export function AddCredits({ balanceMinor }: { balanceMinor: number }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("25.00");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const minor = parseMinor(amount);
  const projected = balanceMinor + (minor ?? 0);

  function confirm() {
    if (minor == null) {
      setError("Enter an amount between $1 and $100.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addCredits(minor);
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.error === "amount" ? "Enter an amount between $1 and $100." : "Could not add credits. Try again.");
      }
    });
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        Add credits
      </Button>
      {open ? (
        <Dialog
          title="Add demo credits"
          description="Credits fund agent purchases on your behalf. Nothing is charged."
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={confirm} disabled={pending}>
                {pending ? "Adding…" : "Add credits"}
              </Button>
            </>
          }
        >
          <div className="gl-tiles">
            {PRESETS.map((preset) => {
              const on = minor === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  className={on ? "gl-tile gl-tile--on" : "gl-tile"}
                  onClick={() => setAmount((preset / 100).toFixed(2))}
                >
                  {formatUsd(preset)}
                </button>
              );
            })}
          </div>
          <Field label="Amount">
            <PriceField
              value={amount}
              inputMode="decimal"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAmount(e.target.value.replace(/[^0-9.]/g, "").slice(0, 8))
              }
            />
          </Field>
          <div className="gl-restate">
            <span className="gl-restate-label">New balance</span>
            <span className="gl-restate-value">{formatUsd(projected)}</span>
          </div>
          {error ? (
            <div className="gl-notice gl-notice--critical" role="alert">
              <div className="gl-notice__copy">
                <span>{error}</span>
              </div>
            </div>
          ) : null}
        </Dialog>
      ) : null}
    </>
  );
}
