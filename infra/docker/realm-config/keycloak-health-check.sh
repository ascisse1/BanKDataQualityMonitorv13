#!/bin/bash
exec 3<>/dev/tcp/localhost/9990

echo -e "GET /health/ready HTTP/1.1
host: localhost:9990
" >&3

timeout --signal=SIGTERM 5 cat <&3 | grep -m 1 status | grep -m 1 UP
ERROR=$?

exec 3<&-
exec 3>&-

exit $ERROR
