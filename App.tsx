
import React, { useState, useRef, useEffect } from 'react';
import { ProfileInfo, Slide, CarouselConfig, UserProfile, CarouselProject, Template } from './types';
import CarouselCard from './src/components/CarouselCard';
import EditorControls from './src/components/EditorControls';
import Login from './src/components/Login';
import Gallery from './src/components/Gallery';
import { toPng } from 'html-to-image';
import { GoogleGenAI, Type } from "@google/genai";
import { auth, logout, saveCarousel, syncUserProfile } from './src/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Loader2, Download, ChevronLeft, ChevronRight, LogOut, Library, Plus, Save } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const [profile, setProfile] = useState<ProfileInfo>({
    name: 'Grupo Decisivo',
    handle: '@grupodecisivo_',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=decisivo'
  });

  const [slides, setSlides] = useState<Slide[]>([
    { id: '1', content: 'Transforme seus pensamentos em carrosséis profissionais no estilo <b>Twitter</b>.' },
    { id: '2', content: 'O conteúdo é automaticamente centralizado na zona de segurança para o <u>Instagram</u>.' },
    { id: '3', content: 'Use o menu lateral para ditar seu texto e gerar todos os cards de uma vez.' }
  ]);

  const [caption, setCaption] = useState('');
  const [ctaContent, setCtaContent] = useState('');
  const [ctaBridge, setCtaBridge] = useState('Se este conteúdo te ajudou de alguma forma:');
  
  const [config, setConfig] = useState<CarouselConfig>({
    theme: 'light',
    fontSize: 48,
    cta: 'Seguir',
    highlightColor: '#74ebd5'
  });

  const [prompts, setPrompts] = useState({
    technical: 'Divida o conteúdo em uma sequência lógica de 4 a 7 slides. Cada slide deve fluir para o próximo como uma conversa. Use no máximo 180 caracteres por card.',
    tone: 'Persuasivo, autoritário, mas acessível. Estilo "thread" do Twitter.'
  });

  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profileData = await syncUserProfile(u);
        setUserProfile(profileData);
        // Set profile info from user if it's a new project
        if (!currentProjectId) {
          setProfile({
            name: profileData.name,
            handle: `@${profileData.email.split('@')[0]}`,
            avatar: profileData.avatar
          });
        }
      } else {
        setUserProfile(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [currentProjectId]);

  const handleSelectProject = (project: CarouselProject) => {
    setCurrentProjectId(project.id);
    setSlides(project.slides);
    setProfile(project.profile);
    setConfig(project.config);
    setPrompts(project.prompts);
    setCaption(project.caption || '');
    setCtaBridge(project.ctaBridge || 'Se este conteúdo te ajudou de alguma forma:');
    setShowGallery(false);
    setActiveCardIndex(0);
  };

  const handleNewProject = () => {
    setCurrentProjectId(null);
    setSlides([
      { id: '1', content: 'Transforme seus pensamentos em carrosséis profissionais no estilo <b>Twitter</b>.' },
      { id: '2', content: 'O conteúdo é automaticamente centralizado na zona de segurança para o <u>Instagram</u>.' },
      { id: '3', content: 'Use o menu lateral para ditar seu texto e gerar todos os cards de uma vez.' }
    ]);
    setCaption('');
    setCtaBridge('Se este conteúdo te ajudou de alguma forma:');
    setActiveCardIndex(0);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const projectId = await saveCarousel(user.uid, {
        id: currentProjectId || '',
        userId: user.uid,
        title: slides[0]?.content.replace(/<[^>]*>/g, '').substring(0, 50) || 'Novo Carrossel',
        slides,
        profile,
        config,
        prompts,
        caption,
        ctaBridge,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setCurrentProjectId(projectId);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Update CTA Content with a natural bridge that feels like a conclusion
  useEffect(() => {
    const handle = profile.handle;
    const icon = config.cta === 'Seguir' ? '🚀' : config.cta === 'Comentar' ? '💬' : config.cta === 'Compartilhar' ? '✈️' : config.cta === 'Salvar' ? '🔖' : '📣';
    
    // The CTA card is a conclusion, not just a floating button
    const content = `<div style="margin-bottom: 32px;">${icon}</div><div style="font-size: 0.85em; opacity: 0.9; margin-bottom: 16px; font-weight: 500; line-height: 1.4;">${ctaBridge}</div><div style="font-size: 1.1em; line-height: 1.2;"><b>${config.cta} <u>${handle}</u></b><br>para dominar as próximas estratégias!</div>`;
    
    setCtaContent(content);
  }, [config.cta, profile.handle, ctaBridge]);

  const handleBulkGenerate = async (text: string) => {
    if (!text.trim()) return;
    setIsGenerating(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const systemInstruction = selectedTemplate 
        ? `Use as seguintes instruções de template: ${selectedTemplate.instructions}. ${selectedTemplate.prompt}`
        : `Aja como um estrategista de conteúdo viral. Crie um carrossel narrativo e a legenda do post sobre: "${text}".
        
        DIRETRIZES TÉCNICAS: ${prompts.technical}
        TOM DE VOZ: ${prompts.tone}
        
        ESTRUTURA OBRIGATÓRIA:
        - Os cards devem contar uma história ou processo passo a passo.
        - Use <b> para negrito, <u> para sublinhado e <mark> para palavras-chave.
        - A "bridge" deve ser a conclusão orgânica e o "gancho" final do conteúdo.
        - A "caption" deve ser uma legenda de alta conversão para Instagram, com um "hook" inicial forte, resumo do valor, emojis e hashtags relevantes.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Conteúdo base: ${text}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              slides: { type: Type.ARRAY, items: { type: Type.STRING } },
              bridge: { type: Type.STRING },
              caption: { type: Type.STRING }
            },
            required: ["slides", "bridge", "caption"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      if (data.slides) {
        setSlides(data.slides.map((c: string) => ({
          id: Math.random().toString(36).substr(2, 9),
          content: c
        })));
        if (data.bridge) setCtaBridge(data.bridge);
        if (data.caption) setCaption(data.caption);
      }
      setActiveCardIndex(0);
      if (scrollRef.current) scrollRef.current.scrollLeft = 0;
    } catch (err) {
      console.error("AI Gen error:", err);
      const manualSlides = text.split(/\n\n+/).filter(Boolean).map(c => ({ 
        id: Math.random().toString(36).substr(2, 9), 
        content: c.trim().replace(/\n/g, '<br>') 
      }));
      setSlides(manualSlides);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIImageGeneration = async (prompt: string) => {
    if (!prompt.trim()) return;
    setIsGeneratingImage(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });

      let imageData = '';
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageData = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageData && activeCardIndex < slides.length) {
        const next = [...slides];
        next[activeCardIndex].image = imageData;
        setSlides(next);
      }
    } catch (err) {
      console.error("AI Image Gen error:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.querySelector('.card-container-fixed')?.clientWidth || 0;
      const gap = 80;
      scrollRef.current.scrollTo({
        left: index * (cardWidth + gap),
        behavior: 'smooth'
      });
      setActiveCardIndex(index);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.querySelector('.card-container-fixed')?.clientWidth || 1;
      const gap = 80;
      const index = Math.round(scrollRef.current.scrollLeft / (cardWidth + gap));
      setActiveCardIndex(index);
    }
  };

  const exportAll = async () => {
    setIsExporting(true);
    try {
      const firstSlideText = slides[0]?.content || 'carousel';
      const cleanName = firstSlideText
        .replace(/<[^>]*>/g, '')
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()
        .substring(0, 35)
        .replace(/^_+|_+$/g, '');
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filePrefix = cleanName ? `${cleanName}_${timestamp}` : `carousel_${timestamp}`;

      // Loop invertido: do último slide para o primeiro
      for (let i = slides.length; i >= 0; i--) {
        const node = cardRefs.current[i];
        if (node) {
          const dataUrl = await toPng(node, {
            canvasWidth: 1080,
            canvasHeight: 1350,
            pixelRatio: 1.5,
            style: { transform: 'scale(1)', margin: '0' }
          });
          const link = document.createElement('a');
          link.download = `${filePrefix}_slide_${i + 1}.png`;
          link.href = dataUrl;
          link.click();
          // Delay essencial para permitir múltiplos downloads no browser
          await new Promise(r => setTimeout(r, 800));
        }
      }
    } catch (err) {
      alert('Erro ao exportar. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f171e]">
        <Loader2 className="w-12 h-12 text-[#1d9bf0] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[420px] bg-off border-r border-border p-10 flex flex-col overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 80 80" fill="none">
                <rect x="12" y="10" width="22" height="28" rx="5" stroke="#007185" stroke-width="2.5" fill="none"/>
                <rect x="12" y="10" width="22" height="28" rx="5" stroke="#007185" stroke-width="2.5" fill="none" transform="rotate(18 23 24)" opacity=".5"/>
                <rect x="36" y="42" width="22" height="28" rx="5" stroke="#007185" stroke-width="2.5" fill="none"/>
                <rect x="36" y="42" width="22" height="28" rx="5" stroke="#007185" stroke-width="2.5" fill="none" transform="rotate(18 47 56)" opacity=".5"/>
                <line x1="24" y1="38" x2="56" y2="42" stroke="#007185" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-navy leading-none">Saltear</h1>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-teal mt-1">White Theme</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowGallery(true)}
              className="p-2.5 text-muted hover:text-teal transition-colors"
              title="Galeria"
            >
              <Library className="w-5 h-5" />
            </button>
            <button 
              onClick={logout}
              className="p-2.5 text-muted hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <EditorControls
          profile={profile} setProfile={setProfile}
          config={config} setConfig={setConfig}
          slides={slides} setSlides={setSlides}
          prompts={prompts} setPrompts={setPrompts}
          onBulkGenerate={handleBulkGenerate}
          onGenerateImage={handleAIImageGeneration}
          activeCardIndex={activeCardIndex}
          isGeneratingImage={isGeneratingImage}
          caption={caption}
          setCaption={setCaption}
          userId={user.uid}
          isAdmin={userProfile?.role === 'admin'}
          selectedTemplateId={selectedTemplate?.id}
          onSelectTemplate={setSelectedTemplate}
        />

        <div className="mt-auto pt-10 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleNewProject}
              className="saltear-btn-secondary py-4 text-[10px]"
            >
              <Plus className="w-4 h-4" /> NOVO
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="saltear-btn-primary py-4 text-[10px] justify-center"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} SALVAR
            </button>
          </div>
          <button
            onClick={exportAll}
            disabled={isExporting}
            className={`w-full py-5 rounded font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 shadow-xl transition-all ${isExporting ? 'bg-border text-muted cursor-not-allowed' : 'bg-teal text-white hover:bg-navy active:scale-[0.98]'}`}
          >
            {isExporting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> EXPORTANDO</>
            ) : (
              <><Download className="w-5 h-5" /> BAIXAR PNG</>
            )}
          </button>
        </div>
      </aside>

      {/* Workspace */}
      <main className="flex-1 relative flex flex-col bg-white overflow-hidden">
        {/* Navigation Arrows */}
        <button 
          onClick={() => scrollToIndex(activeCardIndex - 1)}
          className="absolute left-10 top-1/2 -translate-y-1/2 z-20 p-6 bg-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-border hover:scale-110 active:scale-90 transition disabled:opacity-0"
          disabled={activeCardIndex === 0}
        >
          <ChevronLeft className="w-8 h-8 text-navy" strokeWidth={1.5} />
        </button>

        <button 
          onClick={() => scrollToIndex(activeCardIndex + 1)}
          className="absolute right-10 top-1/2 -translate-y-1/2 z-20 p-6 bg-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-border hover:scale-110 active:scale-90 transition disabled:opacity-0"
          disabled={activeCardIndex === slides.length}
        >
          <ChevronRight className="w-8 h-8 text-navy" strokeWidth={1.5} />
        </button>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="carousel-viewport w-full h-full flex items-center gap-20 overflow-x-auto no-scrollbar px-[calc(50vw-216px)] md:px-[calc(50vw-270px-210px)]"
        >
          {slides.map((slide, index) => (
            <div key={slide.id} className={`card-container-fixed ${activeCardIndex === index ? 'active-card' : ''}`}>
               <div ref={el => cardRefs.current[index] = el} className="card-preview-wrapper rounded-[40px] overflow-hidden">
                  <CarouselCard
                    slide={slide}
                    profile={profile}
                    config={config}
                    onContentChange={(val) => {
                      const next = [...slides];
                      next[index].content = val;
                      setSlides(next);
                    }}
                  />
               </div>
            </div>
          ))}

          {/* Connected CTA Card */}
          <div className={`card-container-fixed ${activeCardIndex === slides.length ? 'active-card' : ''}`}>
             <div ref={el => cardRefs.current[slides.length] = el} className="card-preview-wrapper rounded-[40px] overflow-hidden">
                <CarouselCard
                  slide={{ id: 'cta', content: ctaContent }}
                  profile={profile}
                  config={config}
                  onContentChange={(val) => setCtaContent(val)}
                />
             </div>
          </div>
        </div>

        {/* Bottom Pagination */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6">
           <div className="flex gap-3">
             {[...Array(slides.length + 1)].map((_, i) => (
               <div 
                 key={i} 
                 onClick={() => scrollToIndex(i)}
                 className={`h-1.5 rounded-full transition-all cursor-pointer ${activeCardIndex === i ? 'w-12 bg-teal' : 'w-3 bg-border hover:bg-muted'}`} 
               />
             ))}
           </div>
           <div className="bg-white/80 backdrop-blur-xl border border-border px-8 py-2.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal">Card {activeCardIndex + 1} de {slides.length + 1}</span>
           </div>
        </div>
      </main>

      {/* Gallery Modal */}
      {showGallery && (
        <Gallery 
          userId={user.uid} 
          onSelect={handleSelectProject} 
          onClose={() => setShowGallery(false)} 
        />
      )}

      {/* Loading Overlay */}
      {(isGenerating || isGeneratingImage) && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
           <Loader2 className="w-16 h-16 text-teal animate-spin mb-8" />
           <div className="saltear-eyebrow animate-pulse">
             {isGeneratingImage ? "Pincelando sua imagem..." : "Destilando conhecimento..."}
           </div>
        </div>
      )}
    </div>
  );

};

export default App;
