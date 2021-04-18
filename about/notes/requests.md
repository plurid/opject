curl -L \
    -H "Authorization: Bearer __TESTS__" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{ "id": "one", "data": "data\n" }' \
    http://127.0.0.1:7766/register

curl -L \
    -H "Authorization: Bearer __TESTS__" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{ "id": "one" }' \
    http://127.0.0.1:7766/require

curl -L \
    -H "Authorization: Bearer __TESTS__" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{ "id": "one", "sha": "6667b2d1aab6a00caa5aee5af8ad9f1465e567abf1c209d15727d57b3e8f6e5f" }' \
    http://127.0.0.1:7766/check

curl -L \
    -H "Authorization: Bearer __TESTS__" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{ "id": "one" }' \
    http://127.0.0.1:7766/remove
