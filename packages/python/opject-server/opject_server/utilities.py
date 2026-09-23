import os

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


def resolve_object_path(
    base_path: str,
    object_id,
) -> Optional[str]:
    """Resolve `object_id` inside `base_path`; IDs escaping it resolve to `None`."""
    if not isinstance(object_id, str):
        return None

    base = os.path.abspath(base_path)
    resolved = os.path.abspath(os.path.join(base, object_id))
    if not resolved.startswith(base + os.sep):
        return None

    return resolved
