// Abridged from cmd/gc/city_runtime.go for reading; not the exact source.
// Tracing, logging, and guards are removed, and every omission is marked.
// Identifiers match the original so the linked source stays navigable.
// Source revision: b78058917bc65846db89e1c3b25dc17269822483.

package main

func (cr *CityRuntime) beadReconcileTick(
	ctx context.Context,
	result DesiredStateResult,
	sessionBeads *sessionBeadSnapshot,
	trace *sessionReconcilerTraceCycle,
	bootReconcile bool,
) {
	desiredState := result.State
	store := cr.cityBeadStore()
	if store == nil {
		return
	}
	sessStore := cr.sessionsBeadStore()

	// Omitted: the recordPhase trace helper, called after each phase below.

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

	// Omitted: the store-identity "squatter" hold and the undesired-pool-session
	// sweep, which can reload sessionBeads before the reconcile below.
	openInfos := sessionBeads.OpenInfos()
	cityName := cr.cityName
	cfgNames := configuredSessionNamesWithSnapshot(cr.cfg, cityName, sessionBeads)

	// poolDesired is how many sessions should be awake. Its full computation
	// (pool-demand filter, partial retain, named-demand merge) is omitted.
	poolDesired := result.PoolDesiredCounts

	readyWaitSet, err := prepareWaitWakeStateWithSnapshot(
		sessionpkg.NewStore(sessStore),
		newWaitDependencyStoreSet(store, rigStores),
		cr.nudgesBeadStore(),
		time.Now(),
		sessionBeads,
	)
	if err != nil {
		readyWaitSet = nil // the original logs the error here
	}

	// Controller wake demand comes from assigned-work scans and scale_check, so
	// the per-template work_query set stays empty on this path.
	workSet := make(map[string]bool)

	awakeAssignedWorkBeads, awakeAssignedStoreRefs :=
		filterAssignedWorkBeadsForSessionWake(
			cr.cfg,
			cr.cityPath,
			openInfos,
			assignedWorkBeads,
			assignedWorkStoreRefs,
		)

	reconcileStartOptions := []startExecutionOption{
		withAsyncStartExecution(),
		withAsyncStartFollowUp(cr.requestAsyncStartFollowUpTick),
		withAsyncStartLimiter(cr.ensureAsyncStartLimiter()),
		withAsyncStartTracker(&cr.asyncStarts),
		withAsyncDrainAckStopTracker(&cr.asyncStops),
		withMaxSessionAgeTracker(cr.mat),
		withReadyAssignedFlags(readyAssignedFlagsForBeads(
			result.ReadyAssigned,
			awakeAssignedWorkBeads,
			awakeAssignedStoreRefs,
		)),
	}
	if bootReconcile {
		reconcileStartOptions = append(
			reconcileStartOptions,
			withDeferSessionClosesOnBoot(),
		)
	}

	reconcileSessionBeadsTracedWithNamedDemand(
		ctx,
		cr.cityPath,
		sessionBeads.OpenForReconcile(),
		sessionBeads,
		desiredState,
		cfgNames,
		cr.cfg,
		cr.sp,
		sessStore,
		cr.dops,
		awakeAssignedWorkBeads,
		rigStores,
		readyWaitSet,
		cr.sessionDrains,
		cr.providerHealthGate,
		poolDesired,
		result.NamedSessionDemand,
		result.snapshotQueryPartial(),
		workSet,
		cityName,
		cr.it,
		clock.Real{},
		cr.rec,
		cr.cfg.Session.StartupTimeoutDuration(),
		cr.cfg.Daemon.DriftDrainTimeoutDuration(),
		cr.stdout,
		cr.stderr,
		trace,
		reconcileStartOptions...,
	)

	// Omitted: deferred drain follow-up and post-tick trace recording.

	dispatchSessionBeads, err := loadSessionBeadSnapshot(sessStore.Store)
	if err == nil {
		_ = dispatchReadyWaitNudgesWithSnapshot(
			cr.cityPath,
			cr.cfg,
			sessionpkg.NewStore(sessStore),
			cr.nudgesBeadStore(),
			time.Now(),
			dispatchSessionBeads,
		)
	}

	// Patrol fallback for a wake-socket enqueue lost during a process race.
	cr.nudgeDispatchTick(ctx)

	// A separate backstop wakes live sessions that never claimed their bead.
	if stalledPoolBeads, err := loadSessionBeads(sessStore.Store); err == nil {
		nudgeStalledPoolClaims(
			cr.sp,
			cr.cfg,
			sessStore,
			stalledPoolBeads,
			assignedWorkBeads,
			time.Now(),
			cr.stdout,
		)
	}
}
