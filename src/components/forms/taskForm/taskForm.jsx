import Input from '../input.jsx'
import Select from '../select.jsx'
import Textarea from '../textarea.jsx'
import styles from './taskForm.module.css'

const priorityOptions = [
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
]

const statusOptions = [
  { value: 'Todo', label: 'Todo' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
]

export default function TaskForm({
  values,
  errors,
  projects = [],
  onChange,
  onSubmit,
  formId = 'task-form',
}) {
  const hasProjects = projects.length > 0

  const projectOptions = projects.map((project) => ({
    value: project._id ?? project.id,
    label: project.name,
  }))

  return (
    <form id={formId} className={styles.form} onSubmit={onSubmit}>
      <div className={styles.grid}>
        <Input
          label="Task Name"
          name="title"
          value={values.title}
          onChange={onChange}
          placeholder="Finalize onboarding checklist"
          error={errors.title}
          required
          autoFocus
        />

        <Select
          label="Project"
          name="project"
          value={values.project}
          onChange={onChange}
          options={projectOptions}
          error={errors.project}
          placeholder={hasProjects ? 'Select a project' : 'No projects available'}
          required
        />

        <Select
          label="Priority"
          name="priority"
          value={values.priority}
          onChange={onChange}
          options={priorityOptions}
          error={errors.priority}
        />

        <Select
          label="Status"
          name="status"
          value={values.status}
          onChange={onChange}
          options={statusOptions}
          error={errors.status}
        />

        <Input
          label="Due Date"
          name="dueDate"
          type="date"
          value={values.dueDate}
          onChange={onChange}
          error={errors.dueDate}
        />

        <div className={styles.fullWidth}>
          <Textarea
            label="Description"
            name="description"
            value={values.description}
            onChange={onChange}
            placeholder="Describe the task context and expected output"
            error={errors.description}
          />
        </div>
      </div>
    </form>
  )
}