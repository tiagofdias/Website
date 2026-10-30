The live service reproduced the reported failure: all five configured free OpenRouter routes returned HTTP 429. Changing models within the same free account cannot guarantee capacity.

Common typed profile questions now use the same verified saved answers as shortcut buttons. Matching is deliberately narrow: detailed requests and role descriptions continue to use generation. Age/date-of-birth questions explicitly say those details are not documented; no age is inferred from education dates.

The new frontend replaces provider failures and network outages with an explicitly labeled Profile reference. Related evidence requires at least two matching substantive terms. Without that evidence it says that a verified answer was not found and directs the visitor to contact Tiago. References are never described as generated answers. Explicit Stop still cancels the request.

Backend direct-question handling was pushed in commit 07818f4. Frontend improvements ship with the redesigned portfolio. No paid routes, credentials, or spending settings were changed.

Checks: profileQuestions.test.mjs, chatRoute.test.cjs, aiCompletion.test.cjs, publicAnswers.test.cjs; browser verify-profile-resilience.mjs at 390px/1440px; verify-saved-answers.mjs; scoped ESLint and production build.

This guarantees neither external model uptime nor an answer to undocumented questions. Reliable custom generation requires independent provider capacity; a factual reference keeps the portfolio usable during an outage without inventing an answer.
