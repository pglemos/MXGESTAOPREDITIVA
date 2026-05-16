# TestSprite Legacy Artifacts

This folder contains generated TestSprite artifacts that are not part of the canonical regression suite.

Run the real app regression suite with:

```bash
npm run test:e2e
```

The generated Python files are skipped by default. To inspect them manually, set `TESTSPRITE_ENABLE_LEGACY=true` and provide credentials through `TESTSPRITE_*` environment variables. Do not put real credentials in this folder.
