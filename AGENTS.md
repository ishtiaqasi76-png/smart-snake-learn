# Project rules
- SnakeBoard owns grid gameplay, scoring, speech and controls; SnakeScene only renders the supplied state so the 3D presentation cannot change learning rules.
- Bundle scene assets locally and keep model loading boundaries inside the Canvas so external downloads cannot block gameplay rendering.
- Use the bundled CC0 Quaternius snake model for the head and grid-following textured links for the growing body; preserve skinned transforms in a normalization group and disable skinned-mesh frustum culling to keep the head visible.