import { useNavigate } from 'react-router';

import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { SignupForm } from '@/features/auth/components/SignupForm';

type LandingPageProps = {
  /** Qual modal abrir por cima da landing (vem da rota: /login ou /signup) */
  modal?: 'login' | 'signup';
};

export function LandingPage({ modal }: LandingPageProps) {
  const navigate = useNavigate();
  const closeModal = () => navigate('/', { replace: true });

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex flex-1 flex-col lg:flex-row">
        <div className="flex items-center p-8 lg:flex-1 lg:justify-center">
          <Logo className="size-12 lg:size-[min(380px,60%)] lg:stroke-[1.25]" />
        </div>

        <div className="flex flex-col justify-center p-8 lg:flex-1">
          <h1 className="mb-12 text-[40px] leading-[1.1] font-extrabold tracking-tight sm:text-[64px]">
            Acontecendo agora
          </h1>
          <h2 className="mb-8 text-[23px] font-bold sm:text-[31px]">Inscreva-se hoje</h2>

          <div className="flex w-full max-w-[300px] flex-col gap-3">
            <Button size="md" fullWidth onClick={() => navigate('/signup')}>
              Criar conta
            </Button>
            <p className="mt-10 mb-2 font-bold">Já tem uma conta?</p>
            <Button variant="outline" fullWidth onClick={() => navigate('/login')}>
              Entrar
            </Button>
          </div>
        </div>
      </main>

      <footer className="px-4 py-3 text-center text-[13px] text-muted">
        © {new Date().getFullYear()} Twitter Clone — projeto de estudo
      </footer>

      <Modal open={modal === 'signup'} onClose={closeModal} title="Criar sua conta">
        <SignupForm />
      </Modal>
      <Modal open={modal === 'login'} onClose={closeModal} title="Entre na sua conta">
        <LoginForm />
      </Modal>
    </div>
  );
}
