// Selected production excerpt from cmd/gc/session_beads.go.
// Source revision: b78058917bc65846db89e1c3b25dc17269822483.
// This excerpt is for reading and is not a standalone Go file.

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

	// The next reconciler tick is the idempotent fallback if this read fails.
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
	cancelStateAssignedToRetiredSessionBead(store, id, now, stderr)
	if snapshotErr == nil {
		releaseWorkFromClosedSessionBead(store, snapshot, stderr)
	}
	return true
}

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
	for _, id := range sessionBeadAssigneeIdentities(sessionBead) {
		id = strings.TrimSpace(id)
		if id != "" {
			seenAssignees[id] = struct{}{}
		}
	}

	seenWork := make(map[string]struct{})
	wa := workAssignmentForStore(beads.WorkStore{Store: store})
	for assignee := range seenAssignees {
		for _, status := range []string{"in_progress", "open"} {
			work, err := wa.OpenAssignedToBasic(assignee, status)
			if err != nil {
				fmt.Fprintf(
					stderr,
					"session beads: listing work for %s: %v\n",
					assignee,
					err,
				)
				continue
			}
			for _, item := range work {
				if session.IsSessionBeadOrRepairable(item) {
					continue
				}
				if _, duplicate := seenWork[item.ID]; duplicate {
					continue
				}
				seenWork[item.ID] = struct{}{}

				// Clear the dead assignee and reopen in-progress work.
				// The original path supplied no route fallback here.
				if err := wa.ReleaseWorkBead(item, ""); err != nil {
					fmt.Fprintf(
						stderr,
						"session beads: releasing work %s: %v\n",
						item.ID,
						err,
					)
				}
			}
		}
	}
}
