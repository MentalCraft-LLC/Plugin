(() => {
  const BOUNDARIES = [
    { kind: "captcha", pattern: /captcha|recaptcha|hcaptcha|verify you(?:'|’)re human|prove you are human|验证.*人类/i },
    { kind: "mfa", pattern: /multi.?factor|two.?factor|one.?time password|verification code|security code|authenticator|一次性密码|验证码|双重验证|多因素/i },
    { kind: "login", pattern: /^(?:sign in|log in|login|登录|登入)$/i },
    { kind: "consent", pattern: /accept(?: all)?(?: cookies)?|allow all|reject all|confirm my choices|manage consent preferences|cookie (?:consent|options|preferences)|同意 cookie|接受 cookie|privacy consent/i },
    { kind: "terms", pattern: /terms(?: of service)?|privacy policy|agree to (?:the )?(?:terms|privacy policy)|条款|服务协议|隐私政策|(?:同意|接受).*(?:条款|协议|隐私政策)/i },
    { kind: "account_selection", pattern: /choose account|select account|use another account|选择账号|选择帐户|选择账户|使用其他账号/i },
  ];

  function actionableBoundary(control, boundary) {
    const name = String(control?.name ?? "");
    if (!boundary.pattern.test(name)) return false;
    const role = String(control?.role ?? "").toLowerCase();
    if (boundary.kind === "consent") {
      if (/terms|service|条款|服务协议/i.test(name) && !/cookie|cookies/i.test(name)) return false;
      return role !== "link" || /cookie|consent (?:options|preferences)/i.test(name);
    }
    if (boundary.kind !== "terms") return true;
    if (["checkbox", "switch", "radio"].includes(role)) return true;
    if (role === "button") return /accept|agree|同意|接受/i.test(name);
    return role === "link" && /(?:accept|agree).*(?:terms|privacy policy)|(?:同意|接受).*(?:条款|协议|隐私政策)/i.test(name);
  }

  function detectHumanBoundary(page) {
    const controls = Array.isArray(page?.controls) ? page.controls : [];
    for (const boundary of BOUNDARIES) {
      if (boundary.kind === "login") {
        // A login wall needs more than a lone "login" control: an already
        // signed-in page (e.g. the WeChat admin console) can legitimately
        // contain a visible "登录"-labeled control without being a login
        // wall. Require a password/textbox input or a QR/scan marker
        // alongside the login control before declaring the login boundary.
        const loginControls = controls.filter((control) => actionableBoundary(control, boundary));
        if (loginControls.length === 0) continue;
        const hasCredentialInput = controls.some((control) => {
          const role = String(control?.role ?? "").toLowerCase();
          const name = String(control?.name ?? "");
          return role === "textbox"
            || /password|passwd|扫码|scan|qrcode|二维码|手机号|username|邮箱/i.test(name);
        });
        if (hasCredentialInput) return { kind: boundary.kind, resumable: true };
        continue;
      }
      if (controls.some((control) => actionableBoundary(control, boundary))) {
        return { kind: boundary.kind, resumable: true };
      }
    }
    return null;
  }

  globalThis.spiralDetectHumanBoundary = detectHumanBoundary;
})();
