import os

import pytest


def pytest_collection_modifyitems(config, items):
    if os.getenv("TESTSPRITE_ENABLE_LEGACY") == "true":
        return

    reason = (
        "TestSprite legacy artifacts are quarantined. "
        "Use npm run test:e2e for real regression coverage, or set "
        "TESTSPRITE_ENABLE_LEGACY=true with TESTSPRITE_* credentials to inspect them manually."
    )
    skip_marker = pytest.mark.skip(reason=reason)
    for item in items:
        item.add_marker(skip_marker)
