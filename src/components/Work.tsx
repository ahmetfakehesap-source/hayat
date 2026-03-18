import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, getLocalDate, dateToLocalString } from '../utils/storage';
import type { Task, Project, Milestone } from '../types';
import './Work.css';

const Work: React.FC = () => {
    const { data, updateData } = useApp();
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState<'tasks' | 'projects'>('tasks');
    const [taskTitle, setTaskTitle] = useState('');
    const [taskCategory, setTaskCategory] = useState('');
    // Initialize with Business Development routines if empty
    useEffect(() => {
        if (data.projects.length === 0 && data.tasks.length === 0) {
            const bizProject: Project = {
                id: generateId(),
                name: 'Robux Satış Operasyonu (Faz 1)',
                startDate: getLocalDate(),
                endDate: dateToLocalString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // +30 days
                status: 'in-progress',
                progress: 0,
                notes: 'Ramazan dönemi strateji geliştirme ve mevcut operasyonu koruma.',
                milestones: [
                    { id: generateId(), title: 'Rakip Fiyat Analizi (1. Hafta)', completed: false },
                    { id: generateId(), title: 'Yeni Satış Platformları Araştırması (2. Hafta)', completed: false },
                    { id: generateId(), title: 'Tedarik Zinciri Maliyet Analizi (3. Hafta)', completed: false },
                ]
            };

            const strategyTask: Task = {
                id: generateId(),
                title: 'Strateji Masası - Haftalık Seans 1',
                completed: false,
                createdAt: new Date().toISOString(),
                category: 'İş Geliştirme'
            };
            const strategyTask2: Task = {
                id: generateId(),
                title: 'Strateji Masası - Haftalık Seans 2',
                completed: false,
                createdAt: new Date().toISOString(),
                category: 'İş Geliştirme'
            };

            updateData({
                projects: [bizProject],
                tasks: [strategyTask, strategyTask2]
            });
        }
    }, []);

    // Task handlers
    const handleAddTaskInline = () => {
        if (!taskTitle.trim()) return;

        const newTask: Task = {
            id: generateId(),
            title: taskTitle.trim(),
            completed: false,
            createdAt: new Date().toISOString(),
            category: taskCategory || undefined,
        };

        updateData({ tasks: [...data.tasks, newTask] });
        setTaskTitle('');
        setTaskCategory('');
    };

    const handleToggleTask = (id: string) => {
        const updatedTasks = data.tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        updateData({ tasks: updatedTasks });
    };

    const handleDeleteTask = (id: string) => {
        if (confirm('Bu görevi silmek istediğinize emin misiniz?')) {
            updateData({ tasks: data.tasks.filter((task) => task.id !== id) });
        }
    };

    // Project handlers
    const handleAddProject = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const newProject: Project = {
            id: editingProject?.id || generateId(),
            name: formData.get('name') as string,
            startDate: formData.get('startDate') as string,
            endDate: formData.get('endDate') as string,
            status: formData.get('status') as Project['status'],
            progress: Number(formData.get('progress')) || 0,
            notes: formData.get('notes') as string,
            milestones: editingProject?.milestones || [],
        };

        if (editingProject) {
            updateData({
                projects: data.projects.map((p) => (p.id === editingProject.id ? newProject : p)),
            });
        } else {
            updateData({ projects: [...data.projects, newProject] });
        }

        setShowProjectModal(false);
        setEditingProject(null);
        e.currentTarget.reset();
    };

    const handleDeleteProject = (id: string) => {
        if (confirm('Bu projeyi silmek istediğinize emin misiniz?')) {
            updateData({ projects: data.projects.filter((p) => p.id !== id) });
        }
    };

    const handleAddMilestone = (projectId: string, title: string) => {
        const project = data.projects.find((p) => p.id === projectId);
        if (!project || !title.trim()) return;

        const newMilestone: Milestone = {
            id: generateId(),
            title: title.trim(),
            completed: false,
        };

        const updatedProject = {
            ...project,
            milestones: [...project.milestones, newMilestone],
        };

        updateData({
            projects: data.projects.map((p) => (p.id === projectId ? updatedProject : p)),
        });
    };

    const handleToggleMilestone = (projectId: string, milestoneId: string) => {
        const project = data.projects.find((p) => p.id === projectId);
        if (!project) return;

        const updatedMilestones = project.milestones.map((m) =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );

        updateData({
            projects: data.projects.map((p) =>
                p.id === projectId ? { ...p, milestones: updatedMilestones } : p
            ),
        });
    };

    const activeTasks = data.tasks.filter((t) => !t.completed);
    const completedTasks = data.tasks.filter((t) => t.completed);

    return (
        <div className="work-page">
            <div className="page-header">
                <h1 className="page-title">💼 Kendi İşim</h1>
                <p className="page-subtitle">Görevler, projeler ve kilometre taşlarını yönet</p>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tasks')}
                >
                    ✅ Görevler ({activeTasks.length})
                </button>
                <button
                    className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
                    onClick={() => setActiveTab('projects')}
                >
                    📁 Projeler ({data.projects.length})
                </button>
            </div>

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
                <div className="tab-content fade-in">
                    {/* Inline Quick-Add Task */}
                    <div className="inline-form">
                        <div className="inline-form-row">
                            <div className="inline-field">
                                <label>Görev</label>
                                <input
                                    type="text"
                                    placeholder="Yeni görev yaz..."
                                    value={taskTitle}
                                    onChange={(e) => setTaskTitle(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTaskInline(); }}
                                />
                            </div>
                            <div className="inline-field field-select">
                                <label>Kategori</label>
                                <input
                                    type="text"
                                    placeholder="İş, Kişisel..."
                                    value={taskCategory}
                                    onChange={(e) => setTaskCategory(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTaskInline(); }}
                                />
                            </div>
                            <button className="btn-add" onClick={handleAddTaskInline}>➕ Ekle</button>
                        </div>
                    </div>

                    {/* Active Tasks */}
                    <div className="tasks-section">
                        <h3 className="subsection-title">Aktif Görevler ({activeTasks.length})</h3>
                        <div className="tasks-list">
                            {activeTasks.length === 0 ? (
                                <div className="empty-state">
                                    <p>🎉 Tüm görevler tamamlandı!</p>
                                </div>
                            ) : (
                                activeTasks.map((task) => (
                                    <div key={task.id} className="task-item card">
                                        <div className="task-content">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => handleToggleTask(task.id)}
                                                className="task-checkbox"
                                            />
                                            <div className="task-info">
                                                <span className="task-title">{task.title}</span>
                                                {task.category && (
                                                    <span className="task-category">{task.category}</span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            className="btn-icon delete"
                                            onClick={() => handleDeleteTask(task.id)}
                                            title="Sil"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Completed Tasks */}
                    {completedTasks.length > 0 && (
                        <div className="tasks-section">
                            <h3 className="subsection-title">
                                Tamamlanan Görevler ({completedTasks.length})
                            </h3>
                            <div className="tasks-list">
                                {completedTasks.map((task) => (
                                    <div key={task.id} className="task-item card completed">
                                        <div className="task-content">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => handleToggleTask(task.id)}
                                                className="task-checkbox"
                                            />
                                            <div className="task-info">
                                                <span className="task-title">{task.title}</span>
                                                {task.category && (
                                                    <span className="task-category">{task.category}</span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            className="btn-icon delete"
                                            onClick={() => handleDeleteTask(task.id)}
                                            title="Sil"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
                <div className="tab-content fade-in">
                    <div className="section-header">
                        <h2>Projeler</h2>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setEditingProject(null);
                                setShowProjectModal(true);
                            }}
                        >
                            ➕ Yeni Proje
                        </button>
                    </div>

                    <div className="projects-grid">
                        {data.projects.length === 0 ? (
                            <div className="empty-state card">
                                <p>📁 Henüz proje eklenmemiş</p>
                            </div>
                        ) : (
                            data.projects.map((project) => (
                                <div key={project.id} className="project-card card">
                                    <div className="project-header">
                                        <h3 className="project-name">{project.name}</h3>
                                        <span className={`project-status ${project.status}`}>
                                            {project.status === 'planning' && '📋 Planlama'}
                                            {project.status === 'in-progress' && '🔄 Devam Ediyor'}
                                            {project.status === 'completed' && '✅ Tamamlandı'}
                                            {project.status === 'on-hold' && '⏸️ Beklemede'}
                                        </span>
                                    </div>

                                    <div className="project-dates">
                                        <span>📅 {new Date(project.startDate).toLocaleDateString('tr-TR')}</span>
                                        <span>→</span>
                                        <span>🏁 {new Date(project.endDate).toLocaleDateString('tr-TR')}</span>
                                    </div>

                                    <div className="project-progress">
                                        <div className="progress-header">
                                            <span>İlerleme</span>
                                            <strong>{project.progress}%</strong>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill success"
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {project.notes && (
                                        <div className="project-notes">
                                            <strong>Notlar:</strong>
                                            <p>{project.notes}</p>
                                        </div>
                                    )}

                                    {/* Milestones */}
                                    <div className="milestones-section">
                                        <h4>Kilometre Taşları ({project.milestones.length})</h4>
                                        {project.milestones.map((milestone) => (
                                            <div key={milestone.id} className="milestone-item">
                                                <input
                                                    type="checkbox"
                                                    checked={milestone.completed}
                                                    onChange={() => handleToggleMilestone(project.id, milestone.id)}
                                                />
                                                <span className={milestone.completed ? 'completed' : ''}>
                                                    {milestone.title}
                                                </span>
                                            </div>
                                        ))}
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => {
                                                const title = prompt('Kilometre taşı adı:');
                                                if (title) handleAddMilestone(project.id, title);
                                            }}
                                        >
                                            ➕ Kilometre Taşı Ekle
                                        </button>
                                    </div>

                                    <div className="project-actions">
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => {
                                                setEditingProject(project);
                                                setShowProjectModal(true);
                                            }}
                                        >
                                            ✏️ Düzenle
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm delete"
                                            onClick={() => handleDeleteProject(project.id)}
                                        >
                                            🗑️ Sil
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}


            {/* Project Modal */}
            {showProjectModal && (
                <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingProject ? 'Proje Düzenle' : 'Yeni Proje Ekle'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowProjectModal(false)}>
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleAddProject}>
                            <div className="input-group">
                                <label htmlFor="project-name">Proje Adı *</label>
                                <input
                                    id="project-name"
                                    name="name"
                                    type="text"
                                    className="input"
                                    defaultValue={editingProject?.name}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="project-start">Başlangıç Tarihi *</label>
                                <input
                                    id="project-start"
                                    name="startDate"
                                    type="date"
                                    className="input"
                                    defaultValue={editingProject?.startDate}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="project-end">Bitiş Tarihi *</label>
                                <input
                                    id="project-end"
                                    name="endDate"
                                    type="date"
                                    className="input"
                                    defaultValue={editingProject?.endDate}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="project-status">Durum *</label>
                                <select
                                    id="project-status"
                                    name="status"
                                    className="select"
                                    defaultValue={editingProject?.status || 'planning'}
                                    required
                                >
                                    <option value="planning">Planlama</option>
                                    <option value="in-progress">Devam Ediyor</option>
                                    <option value="completed">Tamamlandı</option>
                                    <option value="on-hold">Beklemede</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label htmlFor="project-progress">İlerleme (%) *</label>
                                <input
                                    id="project-progress"
                                    name="progress"
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="input"
                                    defaultValue={editingProject?.progress || 0}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="project-notes">Notlar</label>
                                <textarea
                                    id="project-notes"
                                    name="notes"
                                    className="textarea"
                                    defaultValue={editingProject?.notes}
                                    placeholder="Proje hakkında notlar..."
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">
                                {editingProject ? 'Güncelle' : 'Ekle'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Work;
