import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  FileSpreadsheet, 
  Search, 
  Edit, 
  Trash2, 
  Clock,
  Loader2,
  Download
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import NoteEditor from "@/components/NoteEditor";

interface Note {
  id: string;
  admin_id: string;
  title: string;
  slug: string | null;
  content: string;
  excerpt: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  is_published: boolean;
}

interface GeneratedDocument {
  id: string;
  generated_by: string;
  type: string;
  title: string;
  description: string | null;
  file_url: string | null;
  version: string | null;
  pages: number | null;
  word_count: number | null;
  generated_at: string;
  metadata: any;
}

const AdminNotes = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchNotes();
    fetchGeneratedDocs();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  };

  const fetchGeneratedDocs = async () => {
    try {
      const { data, error } = await supabase
        .from("generated_documents")
        .select("*")
        .order("generated_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setGeneratedDocs(data || []);
    } catch (error) {
      console.error("Error fetching generated documents:", error);
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteNoteId) return;
    
    try {
      const { error } = await supabase
        .from("admin_notes")
        .delete()
        .eq("id", deleteNoteId);

      if (error) throw error;
      
      toast.success("Note deleted successfully");
      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    } finally {
      setDeleteNoteId(null);
    }
  };

  const handleSaveNote = async (noteData: { title: string; content: string; tags: string[] }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const slug = noteData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const excerpt = noteData.content.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 300);

      if (editingNote) {
        const { error } = await supabase
          .from("admin_notes")
          .update({
            title: noteData.title,
            content: noteData.content,
            slug,
            excerpt,
            tags: noteData.tags,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingNote.id);

        if (error) throw error;
        toast.success("Note updated successfully");
      } else {
        const { error } = await supabase
          .from("admin_notes")
          .insert({
            admin_id: user.id,
            title: noteData.title,
            content: noteData.content,
            slug,
            excerpt,
            tags: noteData.tags
          });

        if (error) throw error;
        toast.success("Note created successfully");
      }

      setShowEditor(false);
      setEditingNote(null);
      fetchNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    }
  };

  const generateSystemDocumentation = async () => {
    setGeneratingDoc(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      toast.info("Generating system documentation... This may take a few minutes.");

      const { data, error } = await supabase.functions.invoke("generate-system-documentation", {
        body: { admin_id: user.id }
      });

      if (error) throw error;

      toast.success("System documentation generated successfully!");
      fetchGeneratedDocs();
      
      // Open PDF in new tab if URL is available
      if (data?.file_url) {
        window.open(data.file_url, '_blank');
      }
    } catch (error) {
      console.error("Error generating documentation:", error);
      toast.error("Failed to generate documentation. Please try again.");
    } finally {
      setGeneratingDoc(false);
    }
  };

  const generateSystemReport = async () => {
    setGeneratingReport(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      toast.info("Generating system report... This may take a few minutes.");

      const { data, error } = await supabase.functions.invoke("generate-system-report", {
        body: { admin_id: user.id }
      });

      if (error) throw error;

      toast.success("System report generated successfully!");
      fetchGeneratedDocs();
      
      // Open PDF in new tab if URL is available
      if (data?.file_url) {
        window.open(data.file_url, '_blank');
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showEditor) {
    return (
      <NoteEditor
        note={editingNote}
        onSave={handleSaveNote}
        onCancel={() => {
          setShowEditor(false);
          setEditingNote(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin-dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Notes</h1>
              <p className="text-muted-foreground">Manage your notes and generate system documentation</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button onClick={() => setShowEditor(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Note
          </Button>
          <Button 
            variant="outline" 
            onClick={generateSystemDocumentation}
            disabled={generatingDoc}
            className="gap-2"
          >
            {generatingDoc ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Generate System Documentation
          </Button>
          <Button 
            variant="outline" 
            onClick={generateSystemReport}
            disabled={generatingReport}
            className="gap-2"
          >
            {generatingReport ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Generate System Report
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Notes Grid */}
        <div className="grid gap-6 mb-12">
          <h2 className="text-xl font-semibold">Your Notes</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notes found. Create your first note!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredNotes.map((note) => (
                <Card key={note.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingNote(note);
                            setShowEditor(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteNoteId(note.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {note.excerpt || "No preview available"}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {note.tags?.slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Generated Documents */}
        <div className="grid gap-6">
          <h2 className="text-xl font-semibold">Generated Documents</h2>
          {generatedDocs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No generated documents yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {generatedDocs.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {doc.type === "documentation" ? (
                          <FileText className="h-8 w-8 text-primary" />
                        ) : (
                          <FileSpreadsheet className="h-8 w-8 text-primary" />
                        )}
                        <div>
                          <h3 className="font-medium">{doc.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {doc.type === "documentation" ? "System Documentation" : "System Report"} • {doc.version}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Generated: {new Date(doc.generated_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {doc.file_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminNotes;
