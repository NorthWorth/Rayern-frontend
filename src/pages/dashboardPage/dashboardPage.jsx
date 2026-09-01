import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlass,
  Plus,
  UserPlus,
  CalendarBlank,
  CheckSquare,
  Kanban,
  Package,
  SealCheck,
  UploadSimple,
  Users,
} from '@phosphor-icons/react'

import { useAuth } from '../../context/authContext.jsx'
import { useClients } from '../../context/clientContext.jsx'
import { useProjects } from '../../context/projectContext.jsx'
import { useTasks } from '../../context/taskContext.jsx'
import { useDeliverables } from '../../context/deliverableContext.jsx'

import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import MetricCard from './metricCard.jsx'

import styles from './dashboardPage.module.css'

const skeletonCards = Array.from(
  { length: 4 },
  (_, index) => index,
)

export default function DashboardPage() {
  const navigate = useNavigate()

  const { user, isLoading: authLoading } = useAuth()
  const {
    clients,
    isLoading: clientsLoading,
  } = useClients()
  const {
    projects,
    isLoading: projectsLoading,
  } = useProjects()
  const {
    tasks,
    isLoading: tasksLoading,
  } = useTasks()

  const { deliverables } = useDeliverables()

  // Real loading state from the contexts — no
  // artificial delays.
  const isLoading =
    authLoading || clientsLoading || projectsLoading || tasksLoading

  const awaitingReviewCount =
    deliverables.filter(
      (item) =>
        item.status === 'Ready for Review' ||
        item.status === 'In Review',
    ).length

  const activeProjects = useMemo(
    () =>
      projects.filter(
        (project) => project.status === 'Active',
      ),
    [projects],
  )

  const getProjectClientName = (project) => {
    if (
      project.client &&
      typeof project.client === 'object'
    ) {
      return (
        project.client.name ||
        project.client.company ||
        ''
      )
    }

    return ''
  }

  const recentActivity = useMemo(() => {
    const items = [
      ...clients.map((client) => ({
        key: `client-${client._id || client.id}`,
        kind: 'Client',
        title: client.name,
        createdAt: client.createdAt,
        path: `/clients/${client._id || client.id}`,
      })),

      ...projects.map((project) => ({
        key: `project-${project._id || project.id}`,
        kind: 'Project',
        title: project.name,
        createdAt: project.createdAt,
        path: `/projects/${project._id || project.id}`,
      })),

      ...tasks.map((task) => ({
        key: `task-${task._id || task.id}`,
        kind: 'Task',
        title: task.title,
        createdAt: task.createdAt,
        path: `/tasks/${task._id || task.id}`,
      })),

      ...deliverables.map((deliverable) => ({
        key: `deliverable-${
          deliverable._id || deliverable.id
        }`,
        kind: 'Deliverable',
        title: deliverable.title,
        createdAt: deliverable.createdAt,
        path: `/review/${
          deliverable._id || deliverable.id
        }`,
      })),
    ]

    return items
      .filter(
        (item) =>
          item.key &&
          !item.key.endsWith('null') &&
          item.title &&
          item.createdAt,
      )
      .sort(
        (left, right) =>
          new Date(right.createdAt) -
          new Date(left.createdAt),
      )
      .slice(0, 6)
  }, [clients, projects, tasks, deliverables])

  const attentionItems = useMemo(() => {
    const today = new Date()

    today.setHours(0, 0, 0, 0)

    const overdueTasks = tasks
      .filter(
        (task) =>
          task.status !== 'Completed' &&
          task.dueDate &&
          new Date(task.dueDate) < today,
      )
      .map((task) => ({
        key: `overdue-task-${
          task._id || task.id
        }`,
        kind: 'Overdue task',
        title: task.title,
        detail: `Due ${new Date(
          task.dueDate,
        ).toLocaleDateString()}`,
        path: `/tasks/${task._id || task.id}`,
        weight: 0,
        sortKey: new Date(task.dueDate),
      }))

    const reviewDeliverables =
      deliverables
        .filter(
          (deliverable) =>
            deliverable.status ===
              'Ready for Review' ||
            deliverable.status === 'In Review',
        )
        .map((deliverable) => ({
          key: `review-${
            deliverable._id || deliverable.id
          }`,
          kind:
            deliverable.status === 'In Review'
              ? 'In review'
              : 'Awaiting review',
          title: deliverable.title,
          detail:
            deliverable.status === 'In Review'
              ? 'Review in progress'
              : 'Ready for your review',
          path: `/review/${
            deliverable._id || deliverable.id
          }`,
          weight: 1,
          sortKey: new Date(
            deliverable.submittedAt || 0,
          ),
        }))

    return [
      ...overdueTasks,
      ...reviewDeliverables,
    ]
      .sort(
        (left, right) =>
          left.weight - right.weight ||
          left.sortKey - right.sortKey,
      )
      .slice(0, 6)
  }, [tasks, deliverables])

  const hasDashboardData = clients.length > 0 || projects.length > 0

  const handleCreateClient = () => {
    navigate('/clients?create=1')
  }

  return (
    <PageLayout
      title={`Welcome back, ${
        user?.firstName || 'there'
      }`}
      subtitle="Your client workspace is ready."
      actions={
        <>
          <button
            className="ghost-btn"
            type="button"
            aria-label="Search dashboard content"
            onClick={() =>
              navigate('/clients?focusSearch=1')
            }
          >
            <MagnifyingGlass
              size={16}
              weight="bold"
              aria-hidden="true"
            />
            Search
          </button>

          <button
            className="primary-btn"
            type="button"
            aria-label="Create a new client"
            onClick={handleCreateClient}
          >
            <Plus
              size={16}
              weight="bold"
              aria-hidden="true"
            />
            New Client
          </button>
        </>
      }
    >
      <div
        className={styles.dashboardShell}
        aria-live="polite"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <div
            className={styles.dashboardSkeleton}
            aria-hidden="true"
          >
            <section
              className={`hero-card ${styles.heroCard}`}
            >
              <div
                className={`${styles.skeletonLine} ${styles.skeletonLineWide}`}
              />
              <div
                className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`}
              />
              <div
                className={`${styles.skeletonLine} ${styles.skeletonLineShort}`}
              />
            </section>

            <section
              className={styles.statsGrid}
              aria-label="Loading KPI cards"
            >
              {skeletonCards.map((item) => (
                <article
                  className={`stat-card ${styles.skeletonCard}`}
                  key={item}
                >
                  <div
                    className={`${styles.skeletonLine} ${styles.skeletonLineShort}`}
                  />
                  <div
                    className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`}
                  />
                  <div
                    className={`${styles.skeletonLine} ${styles.skeletonLineSmall}`}
                  />
                </article>
              ))}
            </section>

            <section className={styles.boardGrid}>
              <article
                className={`panel ${styles.skeletonCard}`}
              >
                <div
                  className={`${styles.skeletonLine} ${styles.skeletonLineShort}`}
                />
                <div
                  className={`${styles.skeletonLine} ${styles.skeletonLineWide}`}
                />
                <div
                  className={`${styles.skeletonLine} ${styles.skeletonLineWide}`}
                />
              </article>

              <article
                className={`panel ${styles.skeletonCard}`}
              >
                <div
                  className={`${styles.skeletonLine} ${styles.skeletonLineShort}`}
                />
                <div
                  className={`${styles.skeletonLine} ${styles.skeletonLineWide}`}
                />
                <div
                  className={`${styles.skeletonLine} ${styles.skeletonLineWide}`}
                />
              </article>
            </section>
          </div>
        ) : (
          <>
            {/* Hero */}
            <section
              className={`hero-card ${styles.heroCard}`}
              aria-labelledby="dashboard-summary-title"
            >
              <div className={styles.heroCopy}>
                <span className={styles.pill}>
                  Business overview
                </span>

                <h3 id="dashboard-summary-title">
                  Everything your client pipeline
                  needs, connected in one calm
                  workspace.
                </h3>

                <p>
                  Track client conversations,
                  project delivery, notes,
                  documents, and files without
                  bouncing between tools.
                </p>
              </div>

              <div className={styles.heroActions}>
                <button
                  className="primary-btn"
                  type="button"
                  aria-label="Open quick actions"
                  onClick={() =>
                    navigate('/clients?create=1')
                  }
                >
                  Quick Actions
                </button>

                <button
                  className="ghost-btn"
                  type="button"
                  aria-label="Review deliverables"
                  onClick={() =>
                    navigate('/deliverables')
                  }
                >
                  Review Deliverables
                </button>
              </div>
            </section>

            {/* Stats */}
            <section
              className={styles.statsGrid}
              aria-label="Business KPIs"
            >
              <MetricCard
                label="Clients"
                value={clients.length}
                delta={
                  clients.length === 0
                    ? 'No clients yet'
                    : `${clients.length} ${
                        clients.length === 1
                          ? 'client'
                          : 'clients'
                      } in workspace`
                }
              />

              <MetricCard
                label="Projects"
                value={projects.length}
                delta={
                  projects.length === 0
                    ? 'No projects yet'
                    : `${projects.length} ${
                        projects.length === 1
                          ? 'project'
                          : 'projects'
                      } in workspace`
                }
              />

              <MetricCard
                label="Tasks"
                value={tasks.length}
                delta={
                  tasks.length === 0
                    ? 'No tasks yet'
                    : `${tasks.length} ${
                        tasks.length === 1
                          ? 'task'
                          : 'tasks'
                      } in workspace`
                }
              />

              <MetricCard
                label="Deliverables"
                value={deliverables.length}
                delta={
                  deliverables.length === 0
                    ? 'No deliverables yet'
                    : awaitingReviewCount > 0
                      ? `${awaitingReviewCount} ${
                          awaitingReviewCount ===
                          1
                            ? 'item'
                            : 'items'
                        } awaiting review`
                      : 'All caught up'
                }
              />
            </section>

            {/* Quick Actions */}
            <section
              className={styles.quickActionsPanel}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">
                    Get started
                  </p>

                  <h3>Quick actions</h3>
                </div>
              </div>

              <div
                className={styles.quickActionsGrid}
              >
                <button
                  className={styles.quickAction}
                  type="button"
                  onClick={handleCreateClient}
                >
                  <span className={styles.quickActionIcon} aria-hidden="true">
                    <UserPlus size={18} weight="fill" />
                  </span>

                  <span
                    className={
                      styles.quickActionCopy
                    }
                  >
                    <strong>Add client</strong>
                    <span>
                      Create a new client profile
                    </span>
                  </span>
                </button>

                <button
                  className={styles.quickAction}
                  type="button"
                  onClick={() =>
                    navigate('/meetings')
                  }
                >
                  <span className={styles.quickActionIcon} aria-hidden="true">
                    <CalendarBlank size={18} weight="fill" />
                  </span>

                  <span
                    className={
                      styles.quickActionCopy
                    }
                  >
                    <strong>
                      Meetings
                    </strong>
                    <span>
                      Coming soon to Rayern
                    </span>
                  </span>
                </button>

                <button
                  className={styles.quickAction}
                  type="button"
                  onClick={() =>
                    navigate('/tasks?create=1')
                  }
                >
                  <span className={styles.quickActionIcon} aria-hidden="true">
                    <CheckSquare size={18} weight="fill" />
                  </span>

                  <span
                    className={
                      styles.quickActionCopy
                    }
                  >
                    <strong>New task</strong>
                    <span>
                      Add something to your task list
                    </span>
                  </span>
                </button>

                <button
                  className={styles.quickAction}
                  type="button"
                  onClick={() =>
                    navigate('/projects?create=1')
                  }
                >
                  <span className={styles.quickActionIcon} aria-hidden="true">
                    <Kanban size={18} weight="fill" />
                  </span>

                  <span
                    className={
                      styles.quickActionCopy
                    }
                  >
                    <strong>New project</strong>
                    <span>
                      Start a client project
                    </span>
                  </span>
                </button>

                <button
                  className={styles.quickAction}
                  type="button"
                  onClick={() =>
                    navigate(
                      '/deliverables?create=1',
                    )
                  }
                >
                  <span className={styles.quickActionIcon} aria-hidden="true">
                    <Package size={18} weight="regular" />
                  </span>

                  <span
                    className={
                      styles.quickActionCopy
                    }
                  >
                    <strong>
                      Create deliverable
                    </strong>
                    <span>
                      Add work for client review
                    </span>
                  </span>
                </button>

                <button
                  className={styles.quickAction}
                  type="button"
                  onClick={() =>
                    navigate('/deliverables')
                  }
                >
                  <span className={styles.quickActionIcon} aria-hidden="true">
                    <SealCheck size={18} weight="fill" />
                  </span>

                  <span
                    className={
                      styles.quickActionCopy
                    }
                  >
                    <strong>
                      Review deliverables
                    </strong>
                    <span>
                      Check work waiting for review
                    </span>
                  </span>
                </button>

                <button
                  className={styles.quickAction}
                  type="button"
                  onClick={() =>
                    navigate('/documents?upload=1')
                  }
                >
                  <span className={styles.quickActionIcon} aria-hidden="true">
                    <UploadSimple size={18} weight="bold" />
                  </span>

                  <span
                    className={
                      styles.quickActionCopy
                    }
                  >
                    <strong>
                      Upload document
                    </strong>
                    <span>
                      Add a client-related file
                    </span>
                  </span>
                </button>

                <button
                  className={styles.quickAction}
                  type="button"
                  onClick={() =>
                    navigate('/clients')
                  }
                >
                  <span className={styles.quickActionIcon} aria-hidden="true">
                    <Users size={18} weight="fill" />
                  </span>

                  <span
                    className={
                      styles.quickActionCopy
                    }
                  >
                    <strong>View clients</strong>
                    <span>
                      Open your client workspace
                    </span>
                  </span>
                </button>
              </div>
            </section>

            {/* Empty dashboard state */}
            {!hasDashboardData && (
              <section className={styles.dashboardEmptyState}>
                <div className={styles.dashboardEmptyContent}>
                  <div className={styles.dashboardEmptyIcon} aria-hidden="true">
                    <Users size={26} weight="fill" />
                  </div>

                  <h3>Your workspace is ready</h3>

                  <p>
                    Add your first client to start building your
                    Rayern workspace. Your projects, tasks,
                    deliverables, and activity will
                    appear here as you add them.
                  </p>

                  <button
                    className="primary-btn"
                    type="button"
                    onClick={handleCreateClient}
                  >
                    Add your first client
                  </button>
                </div>
              </section>
            )}

            {/* Empty dashboard sections */}
            <section
              className={styles.dashboardEmptyGrid}
            >
              <article
                className={`panel ${styles.dashboardEmptyPanel}`}
              >
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">
                      Delivery
                    </p>

                    <h3>Active projects</h3>
                  </div>

                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() =>
                      navigate('/projects')
                    }
                  >
                    View all
                  </button>
                </div>

                <div
                  className={
                    styles.dashboardEmptyPanelContent
                  }
                >
                  {projectsLoading ? (
                    <p>
                      Loading active projects...
                    </p>
                  ) : activeProjects.length ===
                    0 ? (
                    <p>
                      Your active projects will appear
                      here once you create them.
                    </p>
                  ) : (
                    <div
                      className={styles.scheduleList}
                    >
                      {activeProjects.map(
                        (project) => {
                          const projectId =
                            project._id || project.id

                          const clientName =
                            getProjectClientName(
                              project,
                            )

                          return (
                            <button
                              className={
                                styles.scheduleRow
                              }
                              key={projectId}
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/projects/${projectId}`,
                                )
                              }
                            >
                              <span
                                className={
                                  styles.scheduleTitle
                                }
                              >
                                {project.name}
                              </span>

                              <span
                                className={
                                  styles.scheduleMeta
                                }
                              >
                                {Number(
                                  project.progress,
                                ) || 0}
                                %
                                {' · '}
                                Due{' '}
                                {project.dueDate
                                  ? new Date(
                                      project.dueDate,
                                    ).toLocaleDateString()
                                  : 'TBD'}
                                {clientName &&
                                  ` · ${clientName}`}
                              </span>
                            </button>
                          )
                        },
                      )}
                    </div>
                  )}
                </div>
              </article>

              <article
                className={`panel ${styles.dashboardEmptyPanel}`}
              >
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">
                      Meetings
                    </p>

                    <h3>Schedule</h3>
                  </div>
                </div>

                <div
                  className={
                    styles.dashboardEmptyPanelContent
                  }
                >
                  <p>
                    Meeting scheduling is coming
                    soon. Track client work with
                    projects, tasks, and
                    deliverables in the meantime.
                  </p>
                </div>
              </article>
            </section>

            <section
              className={styles.dashboardEmptyGrid}
            >
              <article
                className={`panel ${styles.dashboardEmptyPanel}`}
              >
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">
                      Activity timeline
                    </p>

                    <h3>Recent updates</h3>
                  </div>
                </div>

                <div
                  className={
                    styles.dashboardEmptyPanelContent
                  }
                >
                  {recentActivity.length === 0 ? (
                    <p>
                      Your client activity will appear
                      here as you work.
                    </p>
                  ) : (
                    <div
                      className={styles.scheduleList}
                    >
                      {recentActivity.map(
                        (item) => (
                          <button
                            className={
                              styles.scheduleRow
                            }
                            key={item.key}
                            type="button"
                            onClick={() =>
                              navigate(item.path)
                            }
                          >
                            <span
                              className={
                                styles.scheduleTitle
                              }
                            >
                              {item.title}
                            </span>

                            <span
                              className={
                                styles.scheduleMeta
                              }
                            >
                              {item.kind}
                              {' · '}
                              {new Date(
                                item.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </article>

              <article
                className={`panel ${styles.dashboardEmptyPanel}`}
              >
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">
                      Notifications
                    </p>

                    <h3>Attention center</h3>
                  </div>
                </div>

                <div
                  className={
                    styles.dashboardEmptyPanelContent
                  }
                >
                  {attentionItems.length === 0 ? (
                    <p>
                      Nothing needs your attention
                      right now.
                    </p>
                  ) : (
                    <div
                      className={styles.scheduleList}
                    >
                      {attentionItems.map(
                        (item) => (
                          <button
                            className={
                              styles.scheduleRow
                            }
                            key={item.key}
                            type="button"
                            onClick={() =>
                              navigate(item.path)
                            }
                          >
                            <span
                              className={
                                styles.scheduleTitle
                              }
                            >
                              {item.title}
                            </span>

                            <span
                              className={
                                styles.scheduleMeta
                              }
                            >
                              {item.kind}
                              {' · '}
                              {item.detail}
                            </span>
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </PageLayout>
  )
}