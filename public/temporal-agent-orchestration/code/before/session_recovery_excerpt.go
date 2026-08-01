// Abridged from cmd/gc/session_beads.go for reading; not the exact source.
// Long doc comments and //nolint directives are removed, and every omission
// is marked. Identifiers and log strings match the original.
// Source revision: b78058917bc65846db89e1c3b25dc17269822483.

package main

func closeBead(
	store beads.Store,
	id string,
	reason string,
	now time.Time,
	stderr io.Writer,
) bool {
	if stderr == nil {
		stderr = io.Discard
	}

	// Skip the write when the bead is already closed: three reconciler paths
	// reach closeBead, and each would otherwise write a different terminal
	// state, flapping metadata on a closed bead. This Get result is reused as
	// the snapshot below, and a failed Get is non-fatal because the next
	// reconciler tick is the idempotent fallback.
	snapshot, snapshotErr := store.Get(id)
	if snapshotErr == nil && snapshot.Status == "closed" {
		return false
	}
	if reason == string(session.StateFailedCreate) {
		return closeFailedCreateBead(
			sessionFrontDoor(store),
			id,
			now,
			stderr,
		)
	}
	if setMetaBatch(
		sessionFrontDoor(store),
		id,
		session.ClosePatch(now, reason),
		stderr,
	) != nil {
		return false
	}
	if err := sessionFrontDoor(store).CloseWithoutReason(id); err != nil {
		fmt.Fprintf(stderr, "session beads: closing %s: %v\n", id, err)
		return false
	}
	// Cascade external-messaging cleanup, or a pool respawn leaves zombie
	// memberships and the successor never re-binds.
	cancelStateAssignedToRetiredSessionBead(store, id, now, stderr)
	if snapshotErr == nil {
		releaseWorkFromClosedSessionBead(store, snapshot, stderr)
	}
	return true
}

// Clears the assignee on every non-closed work bead assigned to the given
// session bead and resets in_progress work to open. Best-effort: errors are
// logged but never fail the caller, because releaseOrphanedPoolAssignments on
// the next reconcile tick is the idempotent fallback.
func releaseWorkFromClosedSessionBead(
	store beads.Store,
	sessionBead beads.Bead,
	stderr io.Writer,
) {
	if store == nil {
		return
	}
	if stderr == nil {
		stderr = io.Discard
	}

	seenAssignees := make(map[string]struct{}, 3)
	addAssignee := func(val string) {
		val = strings.TrimSpace(val)
		if val == "" {
			return
		}
		seenAssignees[val] = struct{}{}
	}
	// Any of the bead ID, session_name, configured named identity, alias, or
	// alias history may appear as a work bead's assignee.
	for _, id := range sessionBeadAssigneeIdentities(sessionBead) {
		addAssignee(id)
	}

	seenWork := make(map[string]struct{})
	wa := workAssignmentForStore(beads.WorkStore{Store: store})
	for assignee := range seenAssignees {
		for _, status := range []string{"in_progress", "open"} {
			work, err := wa.OpenAssignedToBasic(assignee, status)
			if err != nil {
				fmt.Fprintf(
					stderr,
					"session beads: listing work assigned to closing session %s (%s): %v\n",
					sessionBead.ID,
					assignee,
					err,
				)
				continue
			}
			for _, item := range work {
				if session.IsSessionBeadOrRepairable(item) {
					continue
				}
				if _, dup := seenWork[item.ID]; dup {
					continue
				}
				seenWork[item.ID] = struct{}{}

				// The owning session is closing, so the work is fully
				// detached. ReleaseWorkBead clears the assignee and stale
				// session-affinity metadata and resets in_progress to open.
				// The close-release path passes no run_target fallback.
				if err := wa.ReleaseWorkBead(item, ""); err != nil {
					fmt.Fprintf(
						stderr,
						"session beads: releasing work %s from closing session %s: %v\n",
						item.ID,
						sessionBead.ID,
						err,
					)
				}
			}
		}
	}
}
