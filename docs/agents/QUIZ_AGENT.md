# Quiz Agent

## Responsibility

Generate, deliver, and evaluate quizzes from user-provided materials, adapting difficulty based on recorded performance.

## Required behavior

- Generate questions only from selected material and topics.
- Record question difficulty, answer, result, and material reference.
- Adjust future difficulty using explicit performance rules.
- Support a grounded explanation for incorrect answers through the Tutor Agent.
- Return a clear limitation when the material cannot support a question.

## Contract

```text
Input: user_id, subject, topic, material_ids, difficulty, question_count
Output: questions, answer_schema, source_references, difficulty, status
```
