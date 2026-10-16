#!/bin/bash
# Usage: test-redirects.sh <mode>
#   local: hits a local Apache on 127.0.0.1:8089 serving dist/ (scheme simulated via X-Test-HTTPS header)
#   live:  hits the real site (default). Run after every deploy that touches public/.htaccess
MODE=${1:-live}
pass=0; fail=0

check() { # scheme host path expected_code expected_location
  local scheme=$1 host=$2 path=$3 code=$4 loc=$5
  if [ "$MODE" = local ]; then
    hdr=(); [ "$scheme" = https ] && hdr=(-H "X-Test-HTTPS: on")
    out=$(curl -s -o /dev/null -m 8 -w '%{http_code} %{redirect_url}' -H "Host: $host" "${hdr[@]}" "http://127.0.0.1:8089$path")
    out=${out//http:\/\/127.0.0.1:8089/}
  else
    out=$(curl -s -o /dev/null -m 10 -w '%{http_code} %{redirect_url}' "$scheme://$host$path")
  fi
  got_code=${out%% *}; got_loc=${out#* }
  # local: relative redirects come back as http://<host>/..., normalise
  got_loc=${got_loc/#http:\/\/www.renancrociari.com/}
  got_loc=${got_loc/#https:\/\/www.renancrociari.com/}
  exp_loc=${loc/#https:\/\/www.renancrociari.com/}
  if [ "$got_code" = "$code" ] && { [ -z "$loc" ] || [ "$got_loc" = "$exp_loc" ]; } && \
     { [ "$code" != 301 ] || [[ "$out" == *"https://www.renancrociari.com"* ]]; }; then
    echo "PASS  $scheme://$host$path -> $out"; pass=$((pass+1))
  else
    echo "FAIL  $scheme://$host$path -> $out   (expected $code $loc)"; fail=$((fail+1))
  fi
}

W=www.renancrociari.com; N=renancrociari.com
# 1. Canonical host (absolute https://www target expected)
check http  $N /about 301 https://www.renancrociari.com/about
check https $N /      301 https://www.renancrociari.com/
check http  $W /      301 https://www.renancrociari.com/
check http  $W /driving-day-1-retention-for-a-social-platform-with-8m-users 301 https://www.renancrociari.com/driving-day-1-retention-for-a-social-platform-with-8m-users
# 1c. Other subdomains must NOT be redirected to www (local only: live jobs. is on Vercel)
if [ "$MODE" = local ]; then
  check https jobs.renancrociari.com /      200
  check http  jobs.renancrociari.com /about 200
fi
# 2. Old case slugs
check https $W /improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands 301 /boosting-ecommerce-conversion-by-87-percent-for-global-fashion-brands
check https $W /connecting-every-discovery-with-a-worthy-home 301 /scaling-a-journal-matching-platform-to-1m-sessions-with-8-6-percent-conversion
check https $W /redesigning-the-mobile-experience-of-a-dating-platform 301 /driving-day-1-retention-for-a-social-platform-with-8m-users
check https $W /driving-platform-growth-through-targeted-researcher-acquisition/ 301 /turning-organic-traffic-into-250k-readers-with-scalable-landing-pages
# 3. index
check https $W /index.html 301 /
check https $W /index      301 /
# 4. .html removal
check https $W /about.html 301 /about
check https $W "/about.html?ref=x" 301 "/about?ref=x"
# 5. trailing slash
check https $W /about/ 301 /about
# 6/7. Served pages
check https $W /       200
check https $W /about  200
check https $W /boosting-ecommerce-conversion-by-87-percent-for-global-fashion-brands 200
check https $W /scaling-a-journal-matching-platform-to-1m-sessions-with-8-6-percent-conversion 200
check https $W /downloads/renancrociari-cv.pdf 200
check https $W /images/ff-case-og-image.jpg 200
check https $W /sitemap.xml 200
check https $W /robots.txt 200
check https $W "/?content=case-journal-finder" 200
check https $W /does-not-exist 404

echo; echo "$pass passed, $fail failed"
