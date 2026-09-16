export async function charge(userId: string, amountCents: number) {
  const res = await fetch("https://api.stripe.com/v1/charges", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.STRIPE_KEY}` },
    body: new URLSearchParams({ amount: String(amountCents), customer: userId }),
  });
  if (!res.ok) throw new Error("charge failed");
  return (await res.json()) as { orderId: string };
}
