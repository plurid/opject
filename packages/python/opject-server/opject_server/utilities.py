from typing import (
    Optional,
)



def check_token(
    bearer: Optional[str],
    verify_token,
):
    if not bearer:
        return False

    bearer_token = bearer.replace('Bearer ', '')
    return verify_token(bearer_token)
