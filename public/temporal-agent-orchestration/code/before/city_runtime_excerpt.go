// Selected production excerpt from cmd/gc/city_runtime.go.
// Source revision: b78058917bc65846db89e1c3b25dc17269822483.
// Unrelated tracing, safety checks, and demand calculations are marked where omitted.
// This excerpt is for reading and is not a standalone Go file.

package main

func (cr *CityRuntime) beadReconcileTick(
	ctx context.Context,
	result DesiredStateResult,
	sessionBeads *sessionBeadSnapshot,
	trace *sessionReconcilerTraceCycle,
	bootReconcile bool,
) {
	store := cr.cityBeadStore()
	if store == nil {
		return
	}
	sessStore := cr.sessionsBeadStore()

	if sessionBeads == nil {
		var sessionQueryPartial bool
		sessionBeads, sessionQueryPartial = cr.loadSessionBeadSnapshotWithPartial()
		result.SessionQueryPartial =
			result.SessionQueryPartial || sessionQueryPartial
	}

	rigStores := cr.rigBeadStores()
	assignedWorkBeads := result.AssignedWorkBeads
	assignedWorkStoreRefs := result.AssignedWorkStoreRefs
	released := releaseOrphanedPoolAssignmentsWhenSnapshotsComplete(
		store,
		cr.cfg,
		cr.cityPath,
		sessionBeads.OpenInfos(),
		result,
		rigStores,
	)
	if len(released) > 0 {
		emitDeadAssigneeReopenedEvents(
			cr.rec,
			assignedWorkBeads,
			released,
			time.Now(),
		)
		assignedWorkBeads, assignedWorkStoreRefs =
			filterReleasedAssignedWorkSnapshot(
				assignedWorkBeads,
				assignedWorkStoreRefs,
				released,
			)
	}

	// Demand calculation, scale-down guards, and trace recording omitted.

	awakeWork, awakeStoreRefs := filterAssignedWorkBeadsForSessionWake(
		cr.cfg,
		cr.cityPath,
		sessionBeads.OpenInfos(),
		assignedWorkBeads,
		assignedWorkStoreRefs,
	)
	reconcileSessionBeadsTracedWithNamedDemand(
		ctx,
		cr.cityPath,
		sessionBeads.OpenForReconcile(),
		sessionBeads,
		result.State,
		configuredSessionNamesWithSnapshot(cr.cfg, cr.cityName, sessionBeads),
		cr.cfg,
		cr.sp,
		sessStore,
		cr.dops,
		awakeWork,
		rigStores,
		nil,
		cr.sessionDrains,
		cr.providerHealthGate,
		result.PoolDesiredCounts,
		result.NamedSessionDemand,
		result.snapshotQueryPartial(),
		map[string]bool{},
		cr.cityName,
		cr.it,
		clock.Real{},
		cr.rec,
		cr.cfg.Session.StartupTimeoutDuration(),
		cr.cfg.Daemon.DriftDrainTimeoutDuration(),
		cr.stdout,
		cr.stderr,
		trace,
		withReadyAssignedFlags(
			readyAssignedFlagsForBeads(
				result.ReadyAssigned,
				awakeWork,
				awakeStoreRefs,
			),
		),
	)

	// Post-reconcile trace recording omitted.

	dispatchSessions, err := loadSessionBeadSnapshot(sessStore.Store)
	if err == nil {
		_ = dispatchReadyWaitNudgesWithSnapshot(
			cr.cityPath,
			cr.cfg,
			sessionpkg.NewStore(sessStore),
			cr.nudgesBeadStore(),
			time.Now(),
			dispatchSessions,
		)
	}

	// Patrol fallback for a wake-socket enqueue lost during a process race.
	cr.nudgeDispatchTick(ctx)

	// A separate backstop wakes live sessions that never claimed their bead.
	if stalled, err := loadSessionBeads(sessStore.Store); err == nil {
		nudgeStalledPoolClaims(
			cr.sp,
			cr.cfg,
			sessStore,
			stalled,
			assignedWorkBeads,
			time.Now(),
			cr.stdout,
		)
	}
}
