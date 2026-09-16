export async function verify(_email: string, _password: string) {
  return null as { id: string; email: string } | null;
}
export async function issueToken(_userId: string) {
  return "tok_live_abc123";
}
