Title: "🧪 [testing improvement] Cover edge cases for calcularProjecao in calculations.ts"

Description:
🎯 **What:** The testing gap in `calcularProjecao` in `src/lib/calculations.ts` was addressed. The existing tests covered simple happy paths, but lacked coverage for edge cases like negative days, negative sales, boundary values, and fractional values.
📊 **Coverage:** The following scenarios are now tested:
- Negative `diasDecorridos`
- Negative `vendas`
- Negative `totalDias`
- `diasDecorridos` greater than `totalDias`
- Fractional inputs
- Large numbers without precision issues
✨ **Result:** Increased test robustness. `calcularProjecao` is now fully covered against potential edge cases, ensuring calculations won't fail or return unexpected results silently when used with extreme values.
