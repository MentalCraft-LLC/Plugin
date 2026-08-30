const FINANCIAL_ACTION = /(?:\bbuy\b|\bpurchase\b|\bpay\b|\bcheckout\b|\bsubscribe\b|\bsubscription\b|\bupgrade\b|\border\b|\btransfer\b|\bsend money\b|\bdonate\b|\btip\b|\bbilling\b|\bpayment\b|\bcredit card\b|\bdebit card\b|\bbank\b|\bwallet\b|\binvoice\b|\brefund\b|\bcharge\b|\bcart\b|\bpricing\b|\bplan\b|[$€£¥]|支付|付款|购买|订阅|升级|结账|下单|转账|捐赠|账单|银行卡)/i;

export function requiresFinancialConfirmation(action: string, url: string, labels: readonly (string | undefined)[]): boolean {
  if (!["click", "fill_public", "fill_local", "press_enter"].includes(action)) return false;
  return FINANCIAL_ACTION.test([url, ...labels].filter(Boolean).join(" "));
}
