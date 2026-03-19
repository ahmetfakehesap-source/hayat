import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, getLocalDate, dateToLocalString } from '../utils/storage';
import type { Task, Project, Milestone } from '../types';
import './Work.css';

const ProjectMilestones: React.FC<{
    project: Project;
    onToggle: (projectId: string, milestoneId: string) => void;
    onAdd: (projectId: string, title: string) => void;
}> = ({ project, onToggle, onAdd }) => {
    const [title, setTitle] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onAdd(project.id, title);
            setTitle('');
        }
    };

    return (
        <div className="milestones-section">
            <div className="milestones-header-inline">
                <h4>Proje Adımları</h4>
                <span className="milestone-badge">{project.milestones.length}</span>
            </div>
            
            <div className="milestones-list">
                {project.milestones.map((milestone) => (
                    <div key={milestone.id} className="milestone-item modern">
                        <label className="milestone-label">
                            <input
                                type="checkbox"
                                className="milestone-checkbox"
                                checked={milestone.completed}
                                onChange={() => onToggle(project.id, milestone.id)}
                            />
                            <div className="checkbox-custom"></div>
                            <span className={milestone.completed ? 'completed' : ''}>
                                {milestone.title}
                            </span>
                        </label>
                    </div>
                ))}
            </div>

            <form className="milestone-add-form" onSubmit={handleSubmit}>
                <div className="milestone-input-wrapper">
                    <span className="plus-icon">＋</span>
                    <input
                        type="text"
                        placeholder="Yeni adım ekle..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
            </form>
        </div>
    );
};

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

            {/* Dashboard Widgets */}
            <div className="work-dashboard">
                <div className="dash-widget">
                    <span className="dash-icon">🚀</span>
                    <span className="dash-value">{data.projects.filter(p => p.status === 'in-progress').length}</span>
                    <span className="dash-label">Aktif Projeler</span>
                </div>
                <div className="dash-widget">
                    <span className="dash-icon">📌</span>
                    <span className="dash-value">{activeTasks.length}</span>
                    <span className="dash-label">Bekleyen Görevler</span>
                </div>
                <div className="dash-widget">
                    <span className="dash-icon">✅</span>
                    <span className="dash-value">{completedTasks.length}</span>
                    <span className="dash-label">Tamamlanan Görevler</span>
                </div>
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
                    {/* Sleek Task Input */}
                    <div className="sleek-task-input-container">
                        <div className="sleek-task-input">
                            <span className="input-icon">✨</span>
                            <input
                                type="text"
                                placeholder="Aklına gelen görevi yaz ve Enter'a bas..."
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddTaskInline(); }}
                                autoFocus
                            />
                            {taskTitle && (
                                <button className="sleek-enter-btn" onClick={handleAddTaskInline}>
                                    Ekle ↵
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Kanban Board */}
                    <div className="kanban-board">
                        {/* To Do Column */}
                        <div className="kanban-column">
                            <div className="kanban-header">
                                <span className="kanban-title">📌 Yapılacaklar <span className="kanban-count">{activeTasks.length}</span></span>
                            </div>
                            <div className="tasks-list">
                                {activeTasks.length === 0 ? (
                                    <div className="empty-state" style={{padding: '1rem', fontSize: '1rem'}}>
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

                        {/* Done Column */}
                        <div className="kanban-column">
                            <div className="kanban-header">
                                <span className="kanban-title">✅ Tamamlananlar <span className="kanban-count">{completedTasks.length}</span></span>
                            </div>
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
                    </div>
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
                            data.projects.map((project) => {
                                const diffDays = Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                return (
                                <div key={project.id} className={`project-card card status-${project.status}`}>
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
                                        {project.status !== 'completed' && (
                                            <span className={`days-remaining ${diffDays > 7 ? 'plenty' : ''}`}>
                                                {diffDays < 0 ? 'Süresi Doldu' : `⏳ ${diffDays} Gün Kaldı`}
                                            </span>
                                        )}
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
                                    <ProjectMilestones
                                        project={project}
                                        onToggle={handleToggleMilestone}
                                        onAdd={handleAddMilestone}
                                    />

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
                                );
                            })
                        )}
                    </div>
                </div>
            )}


            {/* Minimal Project Modal */}
            {showProjectModal && (
                <div className="minimal-modal-overlay" onClick={() => setShowProjectModal(false)}>
                    <div className="minimal-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="minimal-modal-header">
                            <h2>{editingProject ? 'Projeyi Düzenle' : 'Yeni Proje Başlat'}</h2>
                            <button className="minimal-close" title="Kapat" onClick={() => setShowProjectModal(false)}>&times;</button>
                        </div>
                        
                        <form className="minimal-form" onSubmit={handleAddProject}>
                            <div className="minimal-field title-field">
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="Projenin Adı Nedir?"
                                    defaultValue={editingProject?.name}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="minimal-row">
                                <div className="minimal-field">
                                    <label>Başlangıç</label>
                                    <input name="startDate" type="date" defaultValue={editingProject?.startDate || getLocalDate()} required />
                                </div>
                                <div className="minimal-field">
                                    <label>Bitiş</label>
                                    <input name="endDate" type="date" defaultValue={editingProject?.endDate || getLocalDate()} required />
                                </div>
                            </div>

                            <div className="minimal-field">
                                <label>Projenin Durumu</label>
                                <div className="status-toggles">
                                    {['planning', 'in-progress', 'completed', 'on-hold'].map(status => (
                                        <label key={status} className={`status-toggle ${status}`}>
                                            <input type="radio" name="status" value={status} defaultChecked={(editingProject?.status || 'planning') === status} />
                                            <span>
                                                {status === 'planning' && '📋 Planlama'}
                                                {status === 'in-progress' && '🔄 Devam Ediyor'}
                                                {status === 'completed' && '✅ Tamamlandı'}
                                                {status === 'on-hold' && '⏸️ Beklemede'}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="minimal-field">
                                <label>İlerleme (%)</label>
                                <input name="progress" type="range" min="0" max="100" defaultValue={editingProject?.progress || 0} onInput={(e) => {
                                    const val = e.currentTarget.value;
                                    const nextEl = e.currentTarget.nextElementSibling;
                                    if(nextEl) nextEl.textContent = val + '%';
                                }} />
                                <span className="range-val">{editingProject?.progress || 0}%</span>
                            </div>

                            <div className="minimal-field">
                                <textarea name="notes" placeholder="Ekstra notlar, hedefler..." defaultValue={editingProject?.notes}></textarea>
                            </div>

                            <div className="minimal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowProjectModal(false)}>İptal</button>
                                <button type="submit" className="btn-create">{editingProject ? 'Güncelle' : 'Projeyi Başlat 🚀'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Work;
