# Gotcha: Grok `%{DATA}` matches prose text

When extracting fields from `stripped_html`, avoid standalone grok patterns like `Hardness %{DATA:hardness}[;\n]`. `%{DATA}` is greedy and will match the label word appearing anywhere in the page's prose text (e.g., "the Hardness of objects is doubled..."), capturing everything up to the next terminator character.

**Rules for safe grok extraction:**

1. Use `%{NUMBER}` instead of `%{DATA}` for numeric fields.
2. Prefer **combined multi-field patterns** that anchor on the full structured format rather than extracting each field separately. For example, `Hardness %{NUMBER:hardness}; HP \(BT\) %{NUMBER:durability} \(%{NUMBER:break_threshold}\)` is far safer than three separate patterns for hardness, HP, and BT.
3. When a field has multiple formats in the wild, list them as separate patterns in the same grok processor (grok tries them in order, stops at the first match).
4. After adding new grok patterns, always verify that non-target categories don't get spurious extractions:
   ```bash
   # Check for false positives outside the target category
   curl ... '{"query":{"bool":{"must":[{"exists":{"field":"<new_field>"}}],"must_not":[{"match":{"category":"<target>"}}]}},"size":5}'
   ```
