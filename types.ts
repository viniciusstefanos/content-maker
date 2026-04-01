
export type Theme = 'light' | 'dark';

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  avatar: string;
  createdAt: string;
}

export interface ProfileInfo {
  name: string;
  handle: string;
  avatar: string;
}

export interface Slide {
  id: string;
  content: string;
  image?: string; // Base64 ou URL da imagem
}

export interface CarouselConfig {
  theme: Theme;
  fontSize: number;
  cta: string;
  highlightColor: string;
}

export interface CarouselProject {
  id?: string;
  userId: string;
  title: string;
  profile: ProfileInfo;
  slides: Slide[];
  caption: string;
  ctaBridge: string;
  config: CarouselConfig;
  prompts: { technical: string; tone: string };
  templateId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Template {
  id?: string;
  name: string;
  description: string;
  prompt: string;
  instructions: string;
  userId: string;
  createdAt: any;
}
