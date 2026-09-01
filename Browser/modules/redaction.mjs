const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const TOKEN = /\b(?:ya29\.[A-Za-z0-9._~-]{12,}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})\b/g;
const PROVIDER_PATH_ID = /\/projects\/view\/[A-Za-z0-9_-]{5,64}(?=\/|$)|#\/a\d+p\d+(?=\/|$)/g;
const PROVIDER_INLINE_ID = /\b(?:a\d+p\d+|\d{6,})\b/g;
const INVOICE_ID = /\b(?:IN|INV|INVOICE)[-_][A-Z0-9][A-Z0-9_-]{4,}\b/gi;

function redactBillingIdentity(value) {
  let output = value
    .replace(
      /(^|\n)(Payment method|付款方式)\s*\n[\s\S]*?(?=\n(?:Billing email|账单邮箱|Billing address|账单地址|Payment method|付款方式|Subscriptions?|订阅|Invoices?|发票(?:和单据)?|Support|支持|System Status|系统状态|Your Cookie Options)\s*(?:\n|$)|$)/gi,
      "$1$2\n[payment-method]",
    )
    .replace(/(^|\n)(Billing email|账单邮箱)\s*\n[^\n]*/gi, "$1$2\n[identity]")
    .replace(
      /(^|\n)(Billing address|账单地址)\s*\n[\s\S]*?(?=\n(?:Billing email|账单邮箱|Payment method|付款方式|Subscriptions?|订阅|Invoices?|发票(?:和单据)?|Support|支持|System Status|系统状态|Your Cookie Options)\s*(?:\n|$)|$)/gi,
      "$1$2\n[billing-identity]",
    )
    .replace(/(?:[•●*·]\s*){4,}(?:\s*[•●*·]\s*)*\d{4}/g, "[payment-method]")
    .replace(/\b(?:card(?:holder)?|持卡人)\s*[:：]\s*[^\n]+/gi, "cardholder: [billing-identity]")
    .replace(INVOICE_ID, "[invoice-id]");
  output = output.replace(/\[payment-method\](?:\s*\[payment-method\])+/g, "[payment-method]");
  return output;
}

export function redactBrowserString(value, limit) {
  EMAIL.lastIndex = 0;
  TOKEN.lastIndex = 0;
  INVOICE_ID.lastIndex = 0;
  const redacted = redactBillingIdentity(String(value)
    .replace(EMAIL, "[identity]")
    .replace(TOKEN, "[secret]")
    .replace(PROVIDER_PATH_ID, (match) => match.startsWith("/projects/view/") ? "/projects/view/[provider-id]" : "#/provider-id")
    .replace(PROVIDER_INLINE_ID, "[provider-id]"))
    .slice(0, limit);
  EMAIL.lastIndex = 0;
  TOKEN.lastIndex = 0;
  INVOICE_ID.lastIndex = 0;
  return redacted;
}
