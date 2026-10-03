# Tutor and Material Agents

## Shared responsibility

These agents are the authoritative learning-content layer. They may use only the user's supplied or uploaded materials.

## Material Agent

- Extract text and useful structure from supported materials.
- Store material metadata, ownership, processing status, and version hash.
- Retrieve relevant passages for a request.
- Produce summaries or structured notes without introducing external facts.

## Tutor Agent

- Explain retrieved material in the user's requested format.
- Adapt clarity and difficulty only using instructions and evidence available in the request/material.
- Return the lesson text and the material references used.
- Explicitly identify gaps or contradictions in the material.

## Contract

```text
Input: user_request, material_ids, material_version_hashes, response_format
Output: grounded_content, source_references, limitations, status
```
