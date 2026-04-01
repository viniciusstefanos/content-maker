import React, { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { Template } from '../../types';
import { Plus, Trash2, Edit2, Save, X, FileText, Sparkles } from 'lucide-react';

interface Props {
  userId: string;
  isAdmin: boolean;
  selectedTemplateId?: string;
  onSelect: (template: Template) => void;
}

const TemplateManager: React.FC<Props> = ({ userId, isAdmin, selectedTemplateId, onSelect }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<Template>>({
    name: '',
    description: '',
    prompt: '',
    instructions: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'templates'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const templatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Template[];
      setTemplates(templatesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'templates');
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentTemplate.name || !currentTemplate.prompt) return;

    try {
      if (currentTemplate.id) {
        await updateDoc(doc(db, 'templates', currentTemplate.id), {
          ...currentTemplate,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'templates'), {
          ...currentTemplate,
          userId,
          createdAt: new Date().toISOString()
        });
      }
      setIsEditing(false);
      setCurrentTemplate({ name: '', description: '', prompt: '', instructions: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'templates');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir este template?')) {
      try {
        await deleteDoc(doc(db, 'templates', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `templates/${id}`);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        try {
          const data = JSON.parse(content);
          setCurrentTemplate({
            ...currentTemplate,
            name: data.name || currentTemplate.name,
            description: data.description || currentTemplate.description,
            prompt: data.prompt || currentTemplate.prompt,
            instructions: data.instructions || currentTemplate.instructions
          });
        } catch (err) {
          alert('Arquivo JSON inválido.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="saltear-eyebrow">Templates Estratégicos</div>
        {isAdmin && (
          <button
            onClick={() => {
              setIsEditing(true);
              setCurrentTemplate({ name: '', description: '', prompt: '', technical: '', tone: '' });
            }}
            className="text-[10px] font-bold text-teal uppercase hover:underline"
          >
            Novo Template
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="saltear-card space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-navy bricolage">
              {currentTemplate.id ? 'Editar Template' : 'Novo Template'}
            </h3>
            <div className="flex gap-2">
               <label className="cursor-pointer p-2 bg-off rounded hover:bg-border transition">
                  <FileText className="w-3 h-3 text-teal" />
                  <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
               </label>
               <button onClick={() => setIsEditing(false)} className="p-2 bg-off rounded hover:bg-border transition">
                  <X className="w-3 h-3 text-muted" />
               </button>
            </div>
          </div>

          <input
            type="text"
            placeholder="Nome do Template"
            value={currentTemplate.name}
            onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
            className="w-full p-3 bg-white border border-border rounded text-xs outline-none focus:border-teal transition-colors"
          />

          <textarea
            placeholder="Prompt Base (O que a IA deve fazer)"
            value={currentTemplate.prompt}
            onChange={(e) => setCurrentTemplate({ ...currentTemplate, prompt: e.target.value })}
            className="w-full h-24 p-3 bg-white border border-border rounded text-xs outline-none resize-none focus:border-teal transition-colors"
          />

          <textarea
            placeholder="Instruções Adicionais (Diretrizes Técnicas, Tom de Voz, etc.)"
            value={currentTemplate.instructions}
            onChange={(e) => setCurrentTemplate({ ...currentTemplate, instructions: e.target.value })}
            className="w-full h-32 p-3 bg-white border border-border rounded text-xs outline-none resize-none focus:border-teal transition-colors"
          />

          <button
            onClick={handleSave}
            className="saltear-btn-primary w-full justify-center text-[10px]"
          >
            <Save className="w-4 h-4" />
            SALVAR TEMPLATE
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`group flex items-center justify-between p-4 bg-white border rounded transition-all cursor-pointer shadow-sm ${selectedTemplateId === template.id ? 'border-teal ring-2 ring-teal/5' : 'border-border hover:border-teal'}`}
              onClick={() => onSelect(template)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-lt rounded">
                  <Sparkles className="w-4 h-4 text-teal" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-navy bricolage">{template.name}</h4>
                  <p className="text-[10px] text-muted truncate max-w-[180px]">{template.description || 'Sem descrição'}</p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentTemplate(template);
                      setIsEditing(true);
                    }}
                    className="p-2 text-muted hover:text-teal"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template.id!);
                    }}
                    className="p-2 text-muted hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
