(() => {
  const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  const TOKEN = /\b(?:ya29\.[A-Za-z0-9._~-]{12,}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})\b/g;

  /** Preserve public document structure while enforcing the declared text bound. */
  function boundPublicText(raw, maxChars) {
    const limit = Number.isInteger(maxChars) && maxChars >= 0 && maxChars <= 100000 ? maxChars : 0;
    if (limit === 0) return "";
    EMAIL.lastIndex = 0;
    TOKEN.lastIndex = 0;
    const value = String(raw ?? "")
      .replace(/\r\n?/g, "\n")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
      .replace(EMAIL, "[identity]")
      .replace(TOKEN, "[secret]")
      .slice(0, limit);
    EMAIL.lastIndex = 0;
    TOKEN.lastIndex = 0;
    return value;
  }

  globalThis.spiralBoundPublicText = boundPublicText;
})();
