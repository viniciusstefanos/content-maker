
import React, { useState } from 'react';
import { ProfileInfo, Slide, CarouselConfig, Template } from '../../types';
import { Mic, Upload, Trash2, Sparkles, Copy, Check, Layout, Settings, User, Loader2, Download, ChevronLeft, ChevronRight, Library, LogOut, Plus, Save } from 'lucide-react';
import TemplateManager from './TemplateManager';

interface Props {
  profile: ProfileInfo;
  setProfile: (p: ProfileInfo) => void;
  config: CarouselConfig;
  setConfig: (c: CarouselConfig) => void;
  slides: Slide[];
  setSlides: (s: Slide[]) => void;
  prompts: { technical: string; tone: string };
  setPrompts: (p: { technical: string; tone: string }) => void;
  onBulkGenerate: (text: string) => void;
  onGenerateImage: (prompt: string) => void;
  activeCardIndex: number;
  isGeneratingImage: boolean;
  caption: string;
  setCaption: (c: string) => void;
  userId: string;
  isAdmin: boolean;
  selectedTemplateId?: string;
  onSelectTemplate: (template: Template) => void;
}

const EditorControls: React.FC<Props> = ({
  profile, setProfile, config, setConfig, slides, setSlides, prompts, setPrompts, onBulkGenerate, onGenerateImage, activeCardIndex, isGeneratingImage, caption, setCaption, userId, isAdmin, selectedTemplateId, onSelectTemplate
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'templates'>('content');
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setBulkText(prev => prev + (prev ? '\n\n' : '') + transcript);
    };
    recognition.start();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeCardIndex < slides.length) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const next = [...slides];
        next[activeCardIndex].image = event.target?.result as string;
        setSlides(next);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    if (activeCardIndex < slides.length) {
      const next = [...slides];
      delete next[activeCardIndex].image;
      setSlides(next);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-border rounded-lg">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-white text-teal shadow-sm' : 'text-muted hover:text-navy'}`}
        >
          <Layout className="w-3.5 h-3.5" />
          Conteúdo
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'templates' ? 'bg-white text-teal shadow-sm' : 'text-muted hover:text-navy'}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Templates
        </button>
        <button
          onClick={() => setActiveTab('design')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'design' ? 'bg-white text-teal shadow-sm' : 'text-muted hover:text-navy'}`}
        >
          <Settings className="w-3.5 h-3.5" />
          Design
        </button>
      </div>

      {activeTab === 'content' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* 1. Profile Section */}
          <section className="space-y-4">
            <div className="saltear-eyebrow">Perfil Profissional</div>
            <div className="flex gap-4 p-4 rounded-lg bg-white border border-border transition-colors shadow-sm">
              <div className="relative group shrink-0">
                 <img src={profile.avatar} className="w-14 h-14 rounded-full object-cover border-2 border-teal" alt="avatar" />
                 <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setProfile({ ...profile, avatar: URL.createObjectURL(file) });
                    }}
                  />
              </div>
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-transparent border-none outline-none font-bold text-sm text-navy placeholder:text-muted"
                  placeholder="Nome Exibido"
                />
                <input
                  type="text"
                  value={profile.handle}
                  onChange={(e) => setProfile({ ...profile, handle: e.target.value })}
                  className="w-full bg-transparent border-none outline-none text-xs text-body-mid font-medium placeholder:text-muted"
                  placeholder="@seu_usuario"
                />
              </div>
            </div>
          </section>

          {/* 2. Bulk Content Section */}
          <section className="space-y-4">
            <div className="saltear-eyebrow">Gerador Mágico</div>
            <div className="relative">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="w-full h-40 p-5 rounded-lg bg-white border border-border outline-none focus:ring-2 focus:ring-teal/10 transition-all text-sm resize-none no-scrollbar font-medium leading-relaxed text-navy placeholder:text-muted"
                placeholder="Dite ou digite seu conteúdo bruto aqui..."
              />
              <button
                onClick={startRecording}
                className={`absolute bottom-4 right-4 p-2 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-off text-muted hover:text-teal'}`}
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => onBulkGenerate(bulkText)}
              className="saltear-btn-primary w-full justify-center"
            >
              Gerar Carrossel Estratégico
            </button>
          </section>

          {/* 2.5 Image Content Section */}
          <section className="space-y-4 pt-6 border-t border-border">
             <div className="saltear-eyebrow">Mídia do Card Ativo</div>
             <div className="space-y-3">
                <div className="flex gap-2">
                   <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-lg hover:bg-off transition text-[10px] font-bold text-muted">
                      <Upload className="w-4 h-4" />
                      UPLOAD
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                   </label>
                   {activeCardIndex < slides.length && slides[activeCardIndex].image && (
                     <button 
                      onClick={removeImage}
                      className="px-4 py-2 bg-red-50 text-red-500 rounded-lg font-bold text-[10px] hover:bg-red-100 transition flex items-center gap-1"
                     >
                        <Trash2 className="w-3 h-3" />
                        REMOVER
                     </button>
                   )}
                </div>

                <div className="space-y-2">
                   <label className="text-[9px] font-bold uppercase tracking-widest text-muted">Gerar com IA</label>
                   <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={aiImagePrompt}
                        onChange={(e) => setAiImagePrompt(e.target.value)}
                        placeholder="Descreva a imagem..."
                        className="flex-1 p-3 bg-white border border-border rounded-lg text-xs text-navy outline-none"
                      />
                      <button 
                        disabled={isGeneratingImage || !aiImagePrompt.trim()}
                        onClick={() => onGenerateImage(aiImagePrompt)}
                        className="p-3 bg-teal text-white rounded-lg disabled:opacity-50 hover:bg-navy transition-colors"
                      >
                         <Sparkles className="w-4 h-4" />
                      </button>
                   </div>
                </div>
             </div>
          </section>

          {/* New Caption Section */}
          {caption && (
            <section className="space-y-4 pt-6 border-t border-border">
              <div className="flex justify-between items-center">
                <div className="saltear-eyebrow">Legenda do Post</div>
                <button 
                  onClick={copyToClipboard}
                  className={`text-[10px] font-bold uppercase tracking-tighter px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-green-500 text-white' : 'bg-off text-muted hover:bg-teal hover:text-white'}`}
                >
                  {copied ? <><Check className="w-3 h-3" /> COPIADO!</> : <><Copy className="w-3 h-3" /> COPIAR</>}
                </button>
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full h-48 p-4 rounded-lg bg-white border border-border outline-none text-xs font-medium leading-relaxed text-navy resize-none no-scrollbar shadow-sm"
              />
            </section>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <TemplateManager 
            userId={userId} 
            isAdmin={isAdmin} 
            selectedTemplateId={selectedTemplateId}
            onSelect={onSelectTemplate} 
          />
          
          <div className="mt-8 pt-8 border-t border-border space-y-4">
             <div className="saltear-eyebrow">Prompts Ativos</div>
             <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted">Diretrizes Técnicas</label>
                  <textarea
                    value={prompts.technical}
                    onChange={(e) => setPrompts({ ...prompts, technical: e.target.value })}
                    className="w-full h-24 p-3 text-[11px] bg-white border border-border rounded-lg outline-none resize-none text-navy shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted">Tom de Voz</label>
                  <textarea
                    value={prompts.tone}
                    onChange={(e) => setPrompts({ ...prompts, tone: e.target.value })}
                    className="w-full h-24 p-3 text-[11px] bg-white border border-border rounded-lg outline-none resize-none text-navy shadow-sm"
                  />
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'design' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* 3. CTA & Styles */}
          <section className="space-y-6">
            <div className="space-y-4">
              <div className="saltear-eyebrow">Chamada para Ação (CTA)</div>
              <div className="grid grid-cols-2 gap-2">
                {['Seguir', 'Comentar', 'Compartilhar', 'Salvar'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setConfig({...config, cta: opt})}
                    className={`py-2 text-[11px] font-bold rounded border transition ${config.cta === opt ? 'bg-teal text-white border-teal' : 'border-border text-muted hover:bg-off'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={config.cta}
                onChange={(e) => setConfig({ ...config, cta: e.target.value })}
                className="w-full p-3 rounded-lg bg-white border border-border outline-none text-xs font-bold text-navy placeholder:text-muted shadow-sm"
                placeholder="Ou digite outra CTA..."
              />
            </div>

            <div className="space-y-4">
              <div className="saltear-eyebrow">Personalização Visual</div>
              <div className="saltear-card space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-muted uppercase">
                    <span>Tamanho da Fonte</span>
                    <span className="text-navy">{config.fontSize}px</span>
                  </div>
                  <input
                    type="range" min="32" max="100" value={config.fontSize}
                    onChange={(e) => setConfig({ ...config, fontSize: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-teal"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-muted uppercase">
                    <span>Cor do Destaque (Mark)</span>
                    <span className="uppercase text-[9px] font-bold" style={{ color: config.highlightColor }}>{config.highlightColor}</span>
                  </div>
                  <div className="flex gap-2">
                    {['#007185', '#ffd93d', '#ff6b6b', '#6bc1ff', '#a8e6cf'].map(c => (
                      <button
                        key={c}
                        onClick={() => setConfig({ ...config, highlightColor: c })}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${config.highlightColor === c ? 'scale-125 border-navy shadow-lg' : 'border-transparent hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={config.highlightColor}
                      onChange={(e) => setConfig({ ...config, highlightColor: e.target.value })}
                      className="w-6 h-6 p-0 rounded-full bg-transparent border-none cursor-pointer overflow-hidden shadow-sm"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfig({ ...config, theme: 'light' })}
                    className={`flex-1 py-2 text-[10px] font-bold rounded transition border ${config.theme === 'light' ? 'bg-white border-teal text-teal' : 'bg-transparent border-border text-muted'}`}
                  >
                    MODO CLARO
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, theme: 'dark' })}
                    className={`flex-1 py-2 text-[10px] font-bold rounded transition border ${config.theme === 'dark' ? 'bg-navy border-teal text-white' : 'bg-transparent border-border text-muted'}`}
                  >
                    MODO ESCURO
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      <div className="pt-4 text-center">
        <p className="text-[10px] text-muted font-medium tracking-tight">Potencializado por Saltear Intelligence</p>
      </div>
    </div>
  );
};

export default EditorControls;
