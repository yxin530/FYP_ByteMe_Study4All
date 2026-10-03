# Study Rescue Learning Quest And Study Group Agents

## AI Study Rescue Agent

Creates a short-term study plan before an examination using the user's subjects, available time, weak topics, material, and examination date. It must identify assumptions and must not promise outcomes.

## AI Learning Quest Agent

Creates small gamified activities such as topic challenges or progress tasks. Each activity must reference the selected material or topic and remain educationally relevant.

## AI Study Group Match Agent

Suggests compatible study partners or groups using subjects, learning needs, weak topics, study preferences, and availability. It must use only data the user has permitted for matching and must not expose private learning details unnecessarily.

## Shared constraints

- These agents coordinate through the Orchestrator.
- They may use profile and activity metadata for personalization, but learning explanations require relevant source material.
- They must return structured status, assumptions, and evidence references.
