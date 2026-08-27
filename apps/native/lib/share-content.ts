/**
 * Cross-platform Share payload. Android ignores `Share.share({ url })` and
 * only sends `message`; iOS uses both. Always put the link in `message`.
 */
export function shareContent(message: string, url: string): { message: string; url: string } {
  return {
    message: `${message}\n\n${url}`,
    url,
  };
}
