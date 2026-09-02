#!/usr/bin/env python3
import sys
import os
import json
import urllib.request
import urllib.parse

DEFAULT_TOKEN = "wc_mcp_7d13ce52f57fbfd371d48c3de6ed9f1d76c8150a8f94a426"
TOKEN = os.environ.get("GEFEI_TOKEN", DEFAULT_TOKEN)
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

def get_kd(keyword, gl="us", hl="en", force=False):
    url = f"https://seo.web.cafe/kd/api/v1/kd?keyword={urllib.parse.quote(keyword)}&gl={gl}&hl={hl}"
    if force:
        url += "&force=1"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {TOKEN}",
        "User-Agent": USER_AGENT
    })
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {"error": str(e), "keyword": keyword}

def get_referring_insights(month=None):
    if not month:
        # Fetch summary first to get latest
        summary_url = "https://seo.web.cafe/referring/api/summary"
        sreq = urllib.request.Request(summary_url, headers={"User-Agent": USER_AGENT, "X-REF-Token": "1787865231343.eb27980a1648a057fe0746f2c4e78d86eb7ac3910f7ad9f755eb637d2c9058ce"})
        try:
            with urllib.request.urlopen(sreq, timeout=10) as sresp:
                sdata = json.loads(sresp.read().decode())
                month = sdata.get("latest")
        except Exception:
            month = "202607"

    url = f"https://seo.web.cafe/referring/api/insights?m={month}"
    req = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "X-REF-Token": "1787865231343.eb27980a1648a057fe0746f2c4e78d86eb7ac3910f7ad9f755eb637d2c9058ce"
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())

def get_referring_site(domain):
    url = f"https://seo.web.cafe/referring/api/site?domain={urllib.parse.quote(domain)}"
    req = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "X-REF-Token": "1787865231343.eb27980a1648a057fe0746f2c4e78d86eb7ac3910f7ad9f755eb637d2c9058ce"
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())

def main():
    if len(sys.argv) < 2:
        print("Usage: gefei_api.py [kd <kw> | batch_kd <kw1,kw2,...> | insights [month] | site <domain>]")
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "kd":
        if len(sys.argv) < 3:
            print("Usage: gefei_api.py kd <keyword> [gl]")
            sys.exit(1)
        kw = sys.argv[2]
        gl = sys.argv[3] if len(sys.argv) > 3 else "us"
        res = get_kd(kw, gl=gl)
        print(json.dumps(res, ensure_ascii=False, indent=2))

    elif cmd == "batch_kd":
        if len(sys.argv) < 3:
            print("Usage: gefei_api.py batch_kd <kw1,kw2,kw3...>")
            sys.exit(1)
        kws = [k.strip() for k in sys.argv[2].split(",") if k.strip()]
        results = []
        for k in kws:
            r = get_kd(k)
            results.append(r)
        print(json.dumps(results, ensure_ascii=False, indent=2))

    elif cmd == "insights":
        m = sys.argv[2] if len(sys.argv) > 2 else None
        res = get_referring_insights(m)
        print(json.dumps(res, ensure_ascii=False, indent=2))

    elif cmd == "site":
        if len(sys.argv) < 3:
            print("Usage: gefei_api.py site <domain>")
            sys.exit(1)
        res = get_referring_site(sys.argv[2])
        print(json.dumps(res, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
