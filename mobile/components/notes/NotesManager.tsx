import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

interface Note {
    id: string;
    title: string | null;
    content: string;
    category: string | null;
    is_pinned: boolean | null;
    created_at: string | null;
    updated_at: string | null;
    user_id?: string | null;
    related_content?: any;
}

interface NotesManagerProps {
    visible: boolean;
    onClose: () => void;
}

export default function NotesManager({ visible, onClose }: NotesManagerProps) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');

    useEffect(() => {
        if (visible && user?.id) {
            fetchNotes();
        }
    }, [visible, user?.id]);

    const fetchNotes = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('user_notes')
                .select('*')
                .eq('user_id', user.id)
                .order('is_pinned', { ascending: false })
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setNotes(data || []);
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveNote = async () => {
        if (!user?.id || !noteContent.trim()) return;

        try {
            if (editingNote) {
                // Update existing note
                await supabase
                    .from('user_notes')
                    .update({
                        title: noteTitle.trim() || 'Sem título',
                        content: noteContent.trim(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingNote.id);
            } else {
                // Create new note
                await supabase
                    .from('user_notes')
                    .insert({
                        user_id: user.id,
                        title: noteTitle.trim() || 'Sem título',
                        content: noteContent.trim(),
                        category: 'general',
                    });
            }

            await fetchNotes();
            closeEditor();
        } catch (error) {
            console.error('Error saving note:', error);
            Alert.alert('Erro', 'Não foi possível salvar a nota.');
        }
    };

    const deleteNote = async (noteId: string) => {
        Alert.alert(
            'Excluir nota',
            'Tem certeza que deseja excluir esta nota?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await supabase
                                .from('user_notes')
                                .delete()
                                .eq('id', noteId);
                            await fetchNotes();
                        } catch (error) {
                            console.error('Error deleting note:', error);
                        }
                    },
                },
            ]
        );
    };

    const togglePin = async (note: Note) => {
        try {
            await supabase
                .from('user_notes')
                .update({ is_pinned: !note.is_pinned })
                .eq('id', note.id);
            await fetchNotes();
        } catch (error) {
            console.error('Error toggling pin:', error);
        }
    };

    const openEditor = (note?: Note) => {
        if (note) {
            setEditingNote(note);
            setNoteTitle(note.title || '');
            setNoteContent(note.content);
        } else {
            setEditingNote(null);
            setNoteTitle('');
            setNoteContent('');
        }
        setShowEditor(true);
    };

    const closeEditor = () => {
        setShowEditor(false);
        setEditingNote(null);
        setNoteTitle('');
        setNoteContent('');
    };

    const filteredNotes = notes.filter(note =>
        (note.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={28} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Minhas Notas</Text>
                    <TouchableOpacity onPress={() => openEditor()}>
                        <Ionicons name="add-circle" size={28} color={theme.primary} />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={[styles.searchBar, { backgroundColor: theme.card }]}>
                    <Ionicons name="search" size={20} color={theme.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Buscar notas..."
                        placeholderTextColor={theme.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Notes List */}
                <ScrollView style={styles.notesList} showsVerticalScrollIndicator={false}>
                    {filteredNotes.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={48} color={theme.textMuted} />
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>
                                Nenhuma nota ainda
                            </Text>
                            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                                Toque no + para criar sua primeira nota
                            </Text>
                        </View>
                    ) : (
                        filteredNotes.map((note) => (
                            <TouchableOpacity
                                key={note.id}
                                style={[styles.noteCard, { backgroundColor: theme.card }]}
                                onPress={() => openEditor(note)}
                            >
                                <View style={styles.noteHeader}>
                                    <Text style={[styles.noteTitle, { color: theme.text }]} numberOfLines={1}>
                                        {note.is_pinned && '📌 '}{note.title}
                                    </Text>
                                    <View style={styles.noteActions}>
                                        <TouchableOpacity onPress={() => togglePin(note)}>
                                            <Ionicons
                                                name={note.is_pinned ? "pin" : "pin-outline"}
                                                size={18}
                                                color={note.is_pinned ? theme.primary : theme.textMuted}
                                            />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => deleteNote(note.id)}>
                                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <Text style={[styles.noteContent, { color: theme.textSecondary }]} numberOfLines={2}>
                                    {note.content}
                                </Text>
                                <Text style={[styles.noteDate, { color: theme.textMuted }]}>
                                    {formatDate(note.updated_at)}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>

                {/* Note Editor Modal */}
                <Modal
                    visible={showEditor}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={closeEditor}
                >
                    <KeyboardAvoidingView
                        style={[styles.editorContainer, { backgroundColor: theme.background }]}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        <View style={styles.editorHeader}>
                            <TouchableOpacity onPress={closeEditor}>
                                <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <Text style={[styles.editorTitle, { color: theme.text }]}>
                                {editingNote ? 'Editar Nota' : 'Nova Nota'}
                            </Text>
                            <TouchableOpacity onPress={saveNote}>
                                <Text style={[styles.saveText, { color: theme.primary }]}>Salvar</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.titleInput, { color: theme.text, borderColor: theme.cardBorder }]}
                            placeholder="Título da nota"
                            placeholderTextColor={theme.textMuted}
                            value={noteTitle}
                            onChangeText={setNoteTitle}
                        />

                        <TextInput
                            style={[styles.contentInput, { color: theme.text, backgroundColor: theme.card }]}
                            placeholder="Escreva sua nota aqui..."
                            placeholderTextColor={theme.textMuted}
                            value={noteContent}
                            onChangeText={setNoteContent}
                            multiline
                            textAlignVertical="top"
                        />
                    </KeyboardAvoidingView>
                </Modal>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    notesList: {
        flex: 1,
        padding: 20,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: 8,
    },
    noteCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    noteTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    noteActions: {
        flexDirection: 'row',
        gap: 12,
    },
    noteContent: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    noteDate: {
        fontSize: 12,
    },
    editorContainer: {
        flex: 1,
    },
    editorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    editorTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    cancelText: {
        fontSize: 16,
    },
    saveText: {
        fontSize: 16,
        fontWeight: '600',
    },
    titleInput: {
        fontSize: 20,
        fontWeight: '600',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    contentInput: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        padding: 20,
        margin: 20,
        borderRadius: 16,
    },
});
