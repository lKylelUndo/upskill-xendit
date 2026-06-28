import { Xendit } from "xendit-node";

export const xenditClient = process.env.XENDIT_SECRET_KEY
  ? new Xendit({
      secretKey: process.env.XENDIT_SECRET_KEY,
    })
  : null;
