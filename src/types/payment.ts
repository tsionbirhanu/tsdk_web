export type CreateCheckoutRequest = {
  amount: number | string;
  currency?: string; // default: ETB
  email: string;
  first_name: string;
  last_name: string;
  tx_ref?: string;
  callback_url?: string;
  return_url?: string;
};

export type CreateCheckoutResponse = {
  checkout_url: string;
  // keep the raw response for debugging if needed
  raw?: any;
};

export type VerifyResponse = {
  status: string;
  message?: string;
  data?: any;
};
