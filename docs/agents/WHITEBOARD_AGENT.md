# Collaborative Whiteboard

## Responsibilities

- Create independent whiteboard groups or attach a whiteboard to a study group.
- Enforce group membership for shared notes, group chat, revision history, and AI requests.
- Save document revisions atomically with optimistic concurrency checks.
- Use only explicitly selected, ready, user-owned materials as learning evidence.
- Return source material IDs and version hashes with grounded answers and accepted AI edits.
- Return AI edits as proposals. Never apply them until a user explicitly accepts them.

## Boundaries

- The active note is user-authored context, not an authoritative learning source.
- Do not use unselected materials or another member's private materials.
- Preserve a user's local draft when a newer revision arrives; surface a conflict for merge.
- Group owners control membership through creation/linking and deletion. Deleting a group deletes its notes, messages, and revisions.
- Markdown is the first editor format. Freeform drawing and WYSIWYG editing are out of the initial slice.
