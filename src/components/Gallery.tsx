import React, { useEffect, useState } from 'react';
import { db, collection, query, where, orderBy, onSnapshot, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { CarouselProject } from '../../types';
import { Trash2, Edit2, Plus, Clock, X, Loader2 } from 'lucide-react';

interface Props {
  userId: string;
  onSelect: (project: CarouselProject) => void;
  onClose: () => void;
}

const Gallery: React.FC<Props> = ({ userId, onSelect, onClose }) => {
  const [projects, setProjects] = useState<CarouselProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'carousels'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CarouselProject[];
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'carousels');
    });

    return () => unsubscribe();
  }, [userId]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este carrossel?')) {
      try {
        await deleteDoc(doc(db, 'carousels', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `carousels/${id}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-8 border-b border-border flex justify-between items-center bg-off">
          <div>
            <h2 className="text-2xl font-bold text-navy bricolage">Meus Carrosséis</h2>
            <p className="text-sm text-muted mt-1">Gerencie seus projetos salvos</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-border rounded-full transition-colors">
            <X className="w-6 h-6 text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-teal animate-spin mb-4" />
              <p className="text-teal font-bold tracking-widest uppercase text-[10px]">Carregando galeria...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20 bg-off rounded-xl border-2 border-dashed border-border">
              <p className="text-muted font-bold uppercase tracking-widest text-xs">Nenhum projeto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => {
                    onSelect(project);
                    onClose();
                  }}
                  className="group relative p-6 bg-white border border-border rounded-xl hover:border-teal transition-all cursor-pointer shadow-sm hover:shadow-xl"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-navy truncate pr-8 bricolage">
                        {project.title || project.slides[0]?.content.replace(/<[^>]*>/g, '').substring(0, 30) || 'Sem título'}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-muted uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, project.id!)}
                      className="p-2 text-border hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-1.5 overflow-hidden h-16 opacity-30 group-hover:opacity-100 transition-opacity">
                    {project.slides.slice(0, 6).map((slide, i) => (
                      <div key={i} className="w-12 h-full bg-teal-lt rounded-sm shrink-0" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gallery;
