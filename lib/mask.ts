import "server-only";

// Golden rule 3: full usernames must never leave the server. Mask before
// putting a username in any payload sent to the browser.
export function maskUsername(username: string): string {
  const length = username.length;

  if (length <= 2) {
    return "*".repeat(length);
  }

  if (length <= 4) {
    return username[0] + "*".repeat(length - 2) + username[length - 1];
  }

  return (
    username.slice(0, 2) + "*".repeat(length - 4) + username.slice(length - 2)
  );
}
