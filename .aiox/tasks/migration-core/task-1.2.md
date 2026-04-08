# Task: Implement fuzzy header matching and normalization pipeline
- **Story**: Canonical Data Infrastructure & Resilient Import
- **Objective**: Build pipeline that identifies columns based on legacy keywords (e.g., "agendamento carteira" -> `AGD_CART`) and handles normalization (date parsing, number sanitization).
- **QA Integration**: Validate using mixed-format CSV samples from legacy.
- **Pre-requisite**: task-1.1
