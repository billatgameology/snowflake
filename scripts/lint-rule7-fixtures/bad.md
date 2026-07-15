Prose may mention `alpha` as a single-symbol span — this line must NOT trip the lint.
An implementation-shaped inline span like `const alpha = 1` MUST trip the lint.
A waived span like `const alpha = 1` must NOT trip. <!-- rule7-waive: fixture demonstrating the doc waiver. -->

```ts
const alpha = 1; // inside a fenced block this is a use, and MUST trip the lint
```
