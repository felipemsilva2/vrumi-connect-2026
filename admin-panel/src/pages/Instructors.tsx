import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Search, RefreshCw, CheckCircle, XCircle, Eye, MapPin, Phone, X, FileText, Car, CreditCard, Mail, ExternalLink, Shield, AlertTriangle, Download, MessageSquare, Ban, Calendar, Filter, CheckSquare, Square } from 'lucide-react';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Instructor {
    id: string;
    user_id: string;
    full_name: string;
    phone: string;
    city: string;
    state: string;
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    price_per_lesson: number;
    created_at: string;
    categories: string[];
    photo_url?: string;
    bio?: string;
    experience_years?: number;
    cnh_number?: string;
    cnh_category?: string;
    cpf?: string;
    email?: string;
    stripe_account_id?: string;
    stripe_onboarding_complete?: boolean;
    rejection_reason?: string;
    admin_notes?: string;
    cnh_document_url?: string;
    vehicle_document_url?: string;
    credential_document_url?: string;
    background_check_url?: string;
    documents_status?: 'pending' | 'submitted' | 'verified' | 'rejected';
}

const statusConfig: Record<string, { label: string; class: string }> = {
    pending: { label: 'Pendente', class: 'badge-warning' },
    approved: { label: 'Aprovado', class: 'badge-success' },
    rejected: { label: 'Rejeitado', class: 'badge-danger' },
    suspended: { label: 'Suspenso', class: 'badge-default' },
    confirmed: { label: 'Confirmado', class: 'badge-success' },
    cancelled: { label: 'Cancelado', class: 'badge-danger' },
};

const docStatusConfig: Record<string, { label: string; class: string }> = {
    pending: { label: 'Pendente', class: 'badge-default' },
    submitted: { label: 'Enviado', class: 'badge-warning' },
    verified: { label: 'Verificado', class: 'badge-success' },
    rejected: { label: 'Rejeitado', class: 'badge-danger' },
};

export function Instructors() {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [docStatusFilter, setDocStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');
    const [cityFilter, setCityFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);

    const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'notes' | 'bookings'>('info');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [instructorBookings, setInstructorBookings] = useState<any[]>([]);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);

    // Computed unique cities for filter
    const uniqueCities = useMemo(() => {
        const cities = [...new Set(instructors.map(i => i.city).filter(Boolean))];
        return cities.sort();
    }, [instructors]);

    const fetchInstructors = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('instructors')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInstructors(data || []);
        } catch (error) {
            console.error('Error fetching instructors:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInstructors();
    }, []);

    // Advanced filtering
    const filtered = useMemo(() => {
        return instructors.filter(i => {
            // Search filter
            const matchesSearch = searchTerm === '' ||
                i.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.email?.toLowerCase().includes(searchTerm.toLowerCase());

            // Status filter
            const matchesStatus = statusFilter === 'all' || i.status === statusFilter;

            // Document status filter
            const matchesDocStatus = docStatusFilter === 'all' || (i.documents_status || 'pending') === docStatusFilter;

            // City filter
            const matchesCity = cityFilter === 'all' || i.city === cityFilter;

            // Date filter
            let matchesDate = true;
            if (dateFilter !== 'all') {
                const createdAt = parseISO(i.created_at);
                const now = new Date();
                switch (dateFilter) {
                    case '7days':
                        matchesDate = isAfter(createdAt, subDays(now, 7));
                        break;
                    case '30days':
                        matchesDate = isAfter(createdAt, subDays(now, 30));
                        break;
                    case '90days':
                        matchesDate = isAfter(createdAt, subDays(now, 90));
                        break;
                }
            }

            return matchesSearch && matchesStatus && matchesDocStatus && matchesCity && matchesDate;
        });
    }, [instructors, searchTerm, statusFilter, docStatusFilter, cityFilter, dateFilter]);

    // Selection handlers
    const toggleSelectAll = () => {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(i => i.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    // Batch actions
    const handleBatchApprove = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Aprovar ${selectedIds.size} instrutor(es)?`)) return;

        setIsBatchProcessing(true);
        const { error } = await supabase
            .from('instructors')
            .update({ status: 'approved', documents_status: 'verified' })
            .in('id', Array.from(selectedIds));

        if (!error) {
            setSelectedIds(new Set());
            fetchInstructors();
        }
        setIsBatchProcessing(false);
    };

    const handleBatchReject = async () => {
        if (selectedIds.size === 0) return;
        const reason = prompt('Motivo da rejeição (será aplicado a todos):');
        if (!reason) return;

        setIsBatchProcessing(true);
        const { error } = await supabase
            .from('instructors')
            .update({ status: 'rejected', rejection_reason: reason, documents_status: 'rejected' })
            .in('id', Array.from(selectedIds));

        if (!error) {
            setSelectedIds(new Set());
            fetchInstructors();
        }
        setIsBatchProcessing(false);
    };

    const handleBatchSuspend = async () => {
        if (selectedIds.size === 0) return;
        const reason = prompt('Motivo da suspensão (será aplicado a todos):');
        if (!reason) return;

        setIsBatchProcessing(true);
        const { error } = await supabase
            .from('instructors')
            .update({ status: 'suspended', rejection_reason: `Suspenso: ${reason}` })
            .in('id', Array.from(selectedIds));

        if (!error) {
            setSelectedIds(new Set());
            fetchInstructors();
        }
        setIsBatchProcessing(false);
    };

    const handleApprove = async (id: string) => {
        if (!confirm('Aprovar este instrutor?')) return;

        const { error } = await supabase
            .from('instructors')
            .update({ status: 'approved', documents_status: 'verified' })
            .eq('id', id);

        if (!error) {
            fetchInstructors();
            setIsModalOpen(false);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Motivo da rejeição:');
        if (!reason) return;

        const { error } = await supabase
            .from('instructors')
            .update({ status: 'rejected', rejection_reason: reason, documents_status: 'rejected' })
            .eq('id', id);

        if (!error) {
            fetchInstructors();
            setIsModalOpen(false);
        }
    };

    const handleSuspend = async (id: string) => {
        const reason = prompt('Motivo da suspensão:');
        if (!reason) return;

        const { error } = await supabase
            .from('instructors')
            .update({ status: 'suspended', rejection_reason: `Suspenso: ${reason}` })
            .eq('id', id);

        if (!error) {
            fetchInstructors();
            setIsModalOpen(false);
        }
    };

    const handleReactivate = async (id: string) => {
        if (!confirm('Reativar este instrutor?')) return;

        const { error } = await supabase
            .from('instructors')
            .update({ status: 'approved', rejection_reason: null })
            .eq('id', id);

        if (!error) {
            fetchInstructors();
            setIsModalOpen(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!selectedInstructor) return;
        setIsSavingNotes(true);

        const { error } = await supabase
            .from('instructors')
            .update({ admin_notes: adminNotes })
            .eq('id', selectedInstructor.id);

        if (!error) {
            setSelectedInstructor({ ...selectedInstructor, admin_notes: adminNotes });
            fetchInstructors();
        }
        setIsSavingNotes(false);
    };

    const handleViewDetails = async (instructor: Instructor) => {
        setSelectedInstructor(instructor);
        setAdminNotes(instructor.admin_notes || '');
        setActiveTab('info');
        setIsModalOpen(true);
        setInstructorBookings([]);
    };

    const loadInstructorBookings = async () => {
        if (!selectedInstructor) return;
        setIsLoadingBookings(true);

        const { data } = await supabase
            .from('bookings')
            .select(`*, student:profiles!bookings_student_id_fkey(full_name, email)`)
            .eq('instructor_id', selectedInstructor.id)
            .order('scheduled_date', { ascending: false })
            .limit(10);

        setInstructorBookings(data || []);
        setIsLoadingBookings(false);
    };

    useEffect(() => {
        if (activeTab === 'bookings' && selectedInstructor) {
            loadInstructorBookings();
        }
    }, [activeTab, selectedInstructor]);

    const openImagePreview = (url: string) => {
        setImagePreview(url);
    };

    const exportToCSV = () => {
        const headers = ['Nome', 'Telefone', 'Email', 'Cidade', 'Estado', 'Categorias', 'Preço/Aula', 'Status', 'Status Docs', 'Data Cadastro'];
        const dataToExport = selectedIds.size > 0
            ? filtered.filter(i => selectedIds.has(i.id))
            : filtered;

        const rows = dataToExport.map(i => [
            i.full_name,
            i.phone,
            i.email || '',
            i.city,
            i.state,
            i.categories?.join(', ') || '',
            i.price_per_lesson?.toFixed(2) || '0.00',
            statusConfig[i.status]?.label || i.status,
            docStatusConfig[i.documents_status || 'pending']?.label || 'Pendente',
            format(new Date(i.created_at), 'dd/MM/yyyy', { locale: ptBR })
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `instrutores_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
    };

    const clearFilters = () => {
        setStatusFilter('all');
        setDocStatusFilter('all');
        setDateFilter('all');
        setCityFilter('all');
        setSearchTerm('');
    };

    const activeFiltersCount = [statusFilter, docStatusFilter, dateFilter, cityFilter]
        .filter(f => f !== 'all').length + (searchTerm ? 1 : 0);

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '??';
    };

    const hasDocuments = (instructor: Instructor) => {
        return instructor.cnh_document_url || instructor.vehicle_document_url ||
            instructor.credential_document_url || instructor.background_check_url;
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-content">
                    <h1>Instrutores</h1>
                    <p>{filtered.length} de {instructors.length} instrutores</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={exportToCSV}>
                        <Download size={16} />
                        {selectedIds.size > 0 ? `Exportar (${selectedIds.size})` : 'Exportar CSV'}
                    </button>
                    <button className="btn btn-secondary" onClick={fetchInstructors}>
                        <RefreshCw size={16} />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats" style={{ marginBottom: '24px' }}>
                <div className="quick-stat">
                    <div className="value">{instructors.length}</div>
                    <div className="label">Total</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--warning)' }}>
                        {instructors.filter(i => i.status === 'pending').length}
                    </div>
                    <div className="label">Pendentes</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--success)' }}>
                        {instructors.filter(i => i.status === 'approved').length}
                    </div>
                    <div className="label">Aprovados</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--danger)' }}>
                        {instructors.filter(i => i.status === 'rejected').length}
                    </div>
                    <div className="label">Rejeitados</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--text-muted)' }}>
                        {instructors.filter(i => i.status === 'suspended').length}
                    </div>
                    <div className="label">Suspensos</div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-container">
                <div className="filters">
                    <div className="input-group">
                        <Search size={16} className="input-icon" />
                        <input
                            type="text"
                            className="input"
                            placeholder="Buscar por nome, cidade ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Todos os Status</option>
                        <option value="pending">Pendentes</option>
                        <option value="approved">Aprovados</option>
                        <option value="rejected">Rejeitados</option>
                        <option value="suspended">Suspensos</option>
                    </select>
                    <button
                        className={`btn btn-secondary ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={16} />
                        Filtros
                        {activeFiltersCount > 0 && (
                            <span className="filter-badge">{activeFiltersCount}</span>
                        )}
                    </button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="advanced-filters">
                        <select
                            className="select"
                            value={docStatusFilter}
                            onChange={(e) => setDocStatusFilter(e.target.value)}
                        >
                            <option value="all">Documentos: Todos</option>
                            <option value="pending">Docs: Pendente</option>
                            <option value="submitted">Docs: Enviado</option>
                            <option value="verified">Docs: Verificado</option>
                            <option value="rejected">Docs: Rejeitado</option>
                        </select>
                        <select
                            className="select"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        >
                            <option value="all">Data: Todos</option>
                            <option value="7days">Últimos 7 dias</option>
                            <option value="30days">Últimos 30 dias</option>
                            <option value="90days">Últimos 90 dias</option>
                        </select>
                        <select
                            className="select"
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                        >
                            <option value="all">Cidade: Todas</option>
                            {uniqueCities.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                        {activeFiltersCount > 0 && (
                            <button className="btn btn-ghost" onClick={clearFilters}>
                                Limpar filtros
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Batch Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="batch-actions-bar">
                    <span className="batch-count">{selectedIds.size} selecionado(s)</span>
                    <div className="batch-buttons">
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleBatchApprove}
                            disabled={isBatchProcessing}
                        >
                            <CheckCircle size={14} />
                            Aprovar
                        </button>
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={handleBatchReject}
                            disabled={isBatchProcessing}
                        >
                            <XCircle size={14} />
                            Rejeitar
                        </button>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={handleBatchSuspend}
                            disabled={isBatchProcessing}
                        >
                            <Ban size={14} />
                            Suspender
                        </button>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <button
                                    className="btn btn-icon btn-ghost"
                                    onClick={toggleSelectAll}
                                    title={selectedIds.size === filtered.length ? 'Desmarcar todos' : 'Selecionar todos'}
                                >
                                    {selectedIds.size === filtered.length && filtered.length > 0 ? (
                                        <CheckSquare size={16} />
                                    ) : (
                                        <Square size={16} />
                                    )}
                                </button>
                            </th>
                            <th>Instrutor</th>
                            <th>Localização</th>
                            <th>Categorias</th>
                            <th>Preço/Aula</th>
                            <th>Documentos</th>
                            <th>Status</th>
                            <th style={{ width: '140px' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '48px' }}>
                                    <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                                    <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8}>
                                    <div className="empty-state">
                                        <Search size={48} />
                                        <h3>Nenhum instrutor encontrado</h3>
                                        <p>Tente ajustar os filtros de busca</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((instructor) => (
                                <tr key={instructor.id} className={selectedIds.has(instructor.id) ? 'selected' : ''}>
                                    <td>
                                        <button
                                            className="btn btn-icon btn-ghost"
                                            onClick={() => toggleSelect(instructor.id)}
                                        >
                                            {selectedIds.has(instructor.id) ? (
                                                <CheckSquare size={16} style={{ color: 'var(--accent)' }} />
                                            ) : (
                                                <Square size={16} />
                                            )}
                                        </button>
                                    </td>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-cell-avatar">
                                                {getInitials(instructor.full_name)}
                                            </div>
                                            <div className="user-cell-info">
                                                <div className="user-cell-name">{instructor.full_name}</div>
                                                <div className="user-cell-sub">
                                                    <Phone size={10} style={{ display: 'inline', marginRight: '4px' }} />
                                                    {instructor.phone}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                                            <MapPin size={14} />
                                            {instructor.city}, {instructor.state}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {instructor.categories?.map((cat) => (
                                                <span key={cat} className="badge badge-default">{cat}</span>
                                            )) || '-'}
                                        </div>
                                    </td>
                                    <td>
                                        <strong>R$ {instructor.price_per_lesson?.toFixed(2) || '0.00'}</strong>
                                    </td>
                                    <td>
                                        <span className={`badge ${docStatusConfig[instructor.documents_status || 'pending']?.class || 'badge-default'}`}>
                                            {docStatusConfig[instructor.documents_status || 'pending']?.label || 'Pendente'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${statusConfig[instructor.status]?.class || 'badge-default'}`}>
                                            {statusConfig[instructor.status]?.label || instructor.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {instructor.status === 'pending' && (
                                                <>
                                                    <button
                                                        className="btn btn-icon btn-ghost"
                                                        onClick={() => handleApprove(instructor.id)}
                                                        title="Aprovar"
                                                        style={{ color: 'var(--success)' }}
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        className="btn btn-icon btn-ghost"
                                                        onClick={() => handleReject(instructor.id)}
                                                        title="Rejeitar"
                                                        style={{ color: 'var(--danger)' }}
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                            {instructor.status === 'approved' && (
                                                <button
                                                    className="btn btn-icon btn-ghost"
                                                    onClick={() => handleSuspend(instructor.id)}
                                                    title="Suspender"
                                                    style={{ color: 'var(--warning)' }}
                                                >
                                                    <Ban size={18} />
                                                </button>
                                            )}
                                            {instructor.status === 'suspended' && (
                                                <button
                                                    className="btn btn-icon btn-ghost"
                                                    onClick={() => handleReactivate(instructor.id)}
                                                    title="Reativar"
                                                    style={{ color: 'var(--success)' }}
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-icon btn-ghost"
                                                title="Ver detalhes"
                                                onClick={() => handleViewDetails(instructor)}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Details Modal */}
            {isModalOpen && selectedInstructor && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Detalhes do Instrutor</h2>
                            <button className="btn btn-icon btn-ghost" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-tabs">
                            <button className={`modal-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
                                Informações
                            </button>
                            <button className={`modal-tab ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>
                                Documentos
                                {hasDocuments(selectedInstructor) && (
                                    <span className="tab-badge">{
                                        [selectedInstructor.cnh_document_url, selectedInstructor.vehicle_document_url,
                                        selectedInstructor.credential_document_url, selectedInstructor.background_check_url].filter(Boolean).length
                                    }</span>
                                )}
                            </button>
                            <button className={`modal-tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
                                <Calendar size={14} /> Aulas
                            </button>
                            <button className={`modal-tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
                                <MessageSquare size={14} /> Notas
                            </button>
                        </div>

                        <div className="modal-body">
                            {activeTab === 'info' && (
                                <>
                                    <div className="detail-header">
                                        <div className="user-cell-avatar" style={{ width: '64px', height: '64px', fontSize: '20px' }}>
                                            {getInitials(selectedInstructor.full_name)}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{selectedInstructor.full_name}</h3>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <span className={`badge ${statusConfig[selectedInstructor.status]?.class}`}>
                                                    {statusConfig[selectedInstructor.status]?.label}
                                                </span>
                                                <span className={`badge ${docStatusConfig[selectedInstructor.documents_status || 'pending']?.class}`}>
                                                    Docs: {docStatusConfig[selectedInstructor.documents_status || 'pending']?.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <div className="detail-label"><Phone size={14} /> Telefone</div>
                                            <div className="detail-value">{selectedInstructor.phone || '-'}</div>
                                        </div>
                                        <div className="detail-item">
                                            <div className="detail-label"><Mail size={14} /> Email</div>
                                            <div className="detail-value">{selectedInstructor.email || '-'}</div>
                                        </div>
                                        <div className="detail-item">
                                            <div className="detail-label"><MapPin size={14} /> Localização</div>
                                            <div className="detail-value">{selectedInstructor.city}, {selectedInstructor.state}</div>
                                        </div>
                                        <div className="detail-item">
                                            <div className="detail-label"><CreditCard size={14} /> Preço por Aula</div>
                                            <div className="detail-value">R$ {selectedInstructor.price_per_lesson?.toFixed(2) || '0.00'}</div>
                                        </div>
                                        <div className="detail-item">
                                            <div className="detail-label"><Car size={14} /> Categorias</div>
                                            <div className="detail-value">{selectedInstructor.categories?.join(', ') || '-'}</div>
                                        </div>
                                        <div className="detail-item">
                                            <div className="detail-label"><FileText size={14} /> CNH</div>
                                            <div className="detail-value">{selectedInstructor.cnh_number || '-'} ({selectedInstructor.cnh_category || '-'})</div>
                                        </div>
                                        <div className="detail-item">
                                            <div className="detail-label"><FileText size={14} /> CPF</div>
                                            <div className="detail-value">{selectedInstructor.cpf || '-'}</div>
                                        </div>
                                        <div className="detail-item">
                                            <div className="detail-label">Stripe Onboarding</div>
                                            <div className="detail-value">
                                                {selectedInstructor.stripe_onboarding_complete ? (
                                                    <span className="badge badge-success">Completo</span>
                                                ) : selectedInstructor.stripe_account_id ? (
                                                    <span className="badge badge-warning">Pendente</span>
                                                ) : (
                                                    <span className="badge badge-default">Não iniciado</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {selectedInstructor.bio && (
                                        <div style={{ marginTop: '20px' }}>
                                            <div className="detail-label" style={{ marginBottom: '8px' }}>Biografia</div>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
                                                {selectedInstructor.bio}
                                            </p>
                                        </div>
                                    )}

                                    {selectedInstructor.rejection_reason && (
                                        <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                                            <div className="detail-label" style={{ color: 'var(--danger)', marginBottom: '4px' }}>Motivo da Rejeição/Suspensão</div>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                                {selectedInstructor.rejection_reason}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === 'documents' && (
                                <div className="documents-grid">
                                    {[
                                        { label: 'CNH (Habilitação)', url: selectedInstructor.cnh_document_url, icon: FileText },
                                        { label: 'CRLV (Veículo)', url: selectedInstructor.vehicle_document_url, icon: Car },
                                        { label: 'Credencial DETRAN', url: selectedInstructor.credential_document_url, icon: Shield },
                                        { label: 'Antecedentes Criminais', url: selectedInstructor.background_check_url, icon: FileText },
                                    ].map((doc, idx) => (
                                        <div key={idx} className="document-card">
                                            <div className="document-header">
                                                <doc.icon size={20} />
                                                <span>{doc.label}</span>
                                            </div>
                                            {doc.url ? (
                                                <div className="document-preview" onClick={() => openImagePreview(doc.url!)}>
                                                    <img src={doc.url} alt={doc.label} />
                                                    <div className="document-overlay">
                                                        <Eye size={24} />
                                                        <span>Visualizar</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="document-empty">
                                                    <AlertTriangle size={24} />
                                                    <span>Não enviado</span>
                                                </div>
                                            )}
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`btn btn-secondary btn-sm ${!doc.url ? 'disabled' : ''}`}
                                                style={{ marginTop: '8px', width: '100%' }}
                                            >
                                                <ExternalLink size={14} />
                                                Abrir em nova aba
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'bookings' && (
                                <>
                                    {isLoadingBookings ? (
                                        <div style={{ textAlign: 'center', padding: '24px' }}>
                                            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                                            <p style={{ color: 'var(--text-muted)' }}>Carregando aulas...</p>
                                        </div>
                                    ) : instructorBookings.length === 0 ? (
                                        <div className="empty-state">
                                            <Calendar size={48} />
                                            <h3>Nenhuma aula encontrada</h3>
                                            <p>Este instrutor ainda não possui aulas</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {instructorBookings.map((booking) => (
                                                <div key={booking.id} className="detail-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>
                                                            {format(new Date(booking.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })} às {booking.scheduled_time?.substring(0, 5)}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                            {booking.student?.full_name || 'Aluno'}
                                                        </div>
                                                    </div>
                                                    <span className={`badge ${statusConfig[booking.status]?.class || 'badge-default'}`}>
                                                        {statusConfig[booking.status]?.label || booking.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === 'notes' && (
                                <>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
                                            Notas Internas (visível apenas para admins)
                                        </label>
                                        <textarea
                                            className="input"
                                            style={{ minHeight: '150px', resize: 'vertical' }}
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Adicione observações sobre este instrutor..."
                                        />
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSaveNotes}
                                        disabled={isSavingNotes}
                                        style={{ width: '100%' }}
                                    >
                                        {isSavingNotes ? 'Salvando...' : 'Salvar Notas'}
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            {selectedInstructor.status === 'approved' && (
                                <button className="btn btn-danger" onClick={() => handleSuspend(selectedInstructor.id)}>
                                    <Ban size={16} /> Suspender
                                </button>
                            )}
                            {selectedInstructor.status === 'suspended' && (
                                <button className="btn btn-primary" onClick={() => handleReactivate(selectedInstructor.id)}>
                                    <CheckCircle size={16} /> Reativar
                                </button>
                            )}
                            {selectedInstructor.status === 'pending' && (
                                <>
                                    <button className="btn btn-danger" onClick={() => handleReject(selectedInstructor.id)}>
                                        <XCircle size={16} /> Rejeitar
                                    </button>
                                    <button className="btn btn-primary" onClick={() => handleApprove(selectedInstructor.id)}>
                                        <CheckCircle size={16} /> Aprovar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {imagePreview && (
                <div className="modal-overlay" onClick={() => setImagePreview(null)} style={{ zIndex: 1100 }}>
                    <div className="image-preview-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="btn btn-icon btn-ghost"
                            onClick={() => setImagePreview(null)}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.5)' }}
                        >
                            <X size={24} />
                        </button>
                        <img src={imagePreview} alt="Document Preview" />
                    </div>
                </div>
            )}
        </div>
    );
}
