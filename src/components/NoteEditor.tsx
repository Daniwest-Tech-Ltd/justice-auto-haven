import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  X
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
}

interface NoteEditorProps {
  note: Note | null;
  onSave: (noteData: { title: string; content: string; tags: string[] }) => Promise<void>;
  onCancel: () => void;
}

const NoteEditor = ({ note, onSave, onCancel }: NoteEditorProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && note?.content) {
      editorRef.current.innerHTML = note.content;
    }
  }, [note]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }
    
    setSaving(true);
    try {
      const content = editorRef.current?.innerHTML || "";
      await onSave({ title, content, tags });
    } finally {
      setSaving(false);
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      execCommand("insertImage", url);
    }
  };

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    tooltip 
  }: { 
    onClick: () => void; 
    icon: any; 
    tooltip: string 
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClick}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">
                {note ? "Edit Note" : "New Note"}
              </h1>
            </div>
            <Button onClick={handleSave} disabled={saving || !title.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Note"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Note Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter note title..."
                  className="text-lg"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add tag and press Enter..."
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    Add Tag
                  </Button>
                </div>
              </div>

              {/* Editor Toolbar */}
              <div className="space-y-2">
                <Label>Content</Label>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 p-2 flex flex-wrap gap-1 border-b">
                    {/* Text Formatting */}
                    <ToolbarButton onClick={() => execCommand("bold")} icon={Bold} tooltip="Bold" />
                    <ToolbarButton onClick={() => execCommand("italic")} icon={Italic} tooltip="Italic" />
                    <ToolbarButton onClick={() => execCommand("underline")} icon={UnderlineIcon} tooltip="Underline" />
                    
                    <Separator orientation="vertical" className="h-8 mx-1" />
                    
                    {/* Headings */}
                    <ToolbarButton onClick={() => execCommand("formatBlock", "h1")} icon={Heading1} tooltip="Heading 1" />
                    <ToolbarButton onClick={() => execCommand("formatBlock", "h2")} icon={Heading2} tooltip="Heading 2" />
                    <ToolbarButton onClick={() => execCommand("formatBlock", "h3")} icon={Heading3} tooltip="Heading 3" />
                    
                    <Separator orientation="vertical" className="h-8 mx-1" />
                    
                    {/* Lists */}
                    <ToolbarButton onClick={() => execCommand("insertUnorderedList")} icon={List} tooltip="Bullet List" />
                    <ToolbarButton onClick={() => execCommand("insertOrderedList")} icon={ListOrdered} tooltip="Numbered List" />
                    
                    <Separator orientation="vertical" className="h-8 mx-1" />
                    
                    {/* Alignment */}
                    <ToolbarButton onClick={() => execCommand("justifyLeft")} icon={AlignLeft} tooltip="Align Left" />
                    <ToolbarButton onClick={() => execCommand("justifyCenter")} icon={AlignCenter} tooltip="Align Center" />
                    <ToolbarButton onClick={() => execCommand("justifyRight")} icon={AlignRight} tooltip="Align Right" />
                    
                    <Separator orientation="vertical" className="h-8 mx-1" />
                    
                    {/* Insert */}
                    <ToolbarButton onClick={insertLink} icon={LinkIcon} tooltip="Insert Link" />
                    <ToolbarButton onClick={insertImage} icon={ImageIcon} tooltip="Insert Image" />
                    <ToolbarButton onClick={() => execCommand("formatBlock", "pre")} icon={Code} tooltip="Code Block" />
                    <ToolbarButton onClick={() => execCommand("formatBlock", "blockquote")} icon={Quote} tooltip="Quote" />
                    
                    <Separator orientation="vertical" className="h-8 mx-1" />
                    
                    {/* Undo/Redo */}
                    <ToolbarButton onClick={() => execCommand("undo")} icon={Undo} tooltip="Undo" />
                    <ToolbarButton onClick={() => execCommand("redo")} icon={Redo} tooltip="Redo" />
                  </div>

                  {/* Editor Content Area */}
                  <div
                    ref={editorRef}
                    contentEditable
                    className="min-h-[400px] p-4 focus:outline-none prose prose-sm max-w-none dark:prose-invert"
                    style={{
                      overflowY: "auto"
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData("text/plain");
                      document.execCommand("insertText", false, text);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default NoteEditor;
