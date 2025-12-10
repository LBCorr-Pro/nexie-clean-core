// src/components/user-nav.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Icon } from "@/components/ui/icon"; 
import { useRouter, useParams } from "next/navigation"
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { getAuth, signOut } from "firebase/auth"; 
import { useToast } from "@/hooks/nx-use-toast";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { cn } from "@/lib/utils";
import { getFirebaseAuth } from "@/lib/firebase";

export function UserNav() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast(); 
  const { isActingAsMaster, actingAsInstanceId, actingAsInstanceName, setActingAs } = useInstanceActingContext();
  const { currentUser } = useUserPermissions();

  const user = {
    name: currentUser?.displayName || "Usuário", 
    email: currentUser?.email || "Não autenticado", 
    avatarUrl: currentUser?.photoURL || null, 
  }
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const handleSettingsClick = () => {
    // CORREÇÃO: Aponta para a nova página de preferências do usuário.
    router.push(`/${locale}/account/preferences`);
  };

  const handleProfileClick = () => {
    router.push(`/${locale}/profile`);
  };

  const handleSecurityClick = () => {
    router.push(`/${locale}/account/security`);
  };

  const handleLogoutClick = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      setActingAs(null, null);
      toast({
        title: "Logout Realizado",
        description: "Você foi desconectado com sucesso.",
      });
      router.push(`/${locale}/login`); 
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro no Logout",
        description: "Não foi possível desconectar. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  let roleDisplayText = "";
  if (isActingAsMaster && !actingAsInstanceId) {
    roleDisplayText = "Papel: Administrador Master";
  } else if (isActingAsMaster && actingAsInstanceId) {
    roleDisplayText = `Atuando como Master em: ${actingAsInstanceName || 'Instância'}`;
  }
  
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex items-center gap-2 user-nav">
        <ThemeSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback>{initials || <Icon name="UserCircle" className="h-5 w-5" />}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
                {roleDisplayText && (
                  <div className="flex items-center pt-1">
                    <Icon name="Shield" className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs leading-none text-muted-foreground">
                      {roleDisplayText}
                    </p>
                  </div>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
                <Icon name="UserCircle" className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick} style={{ cursor: 'pointer' }}>
                <Icon name="Settings" className="mr-2 h-4 w-4" />
                <span>Preferências</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSecurityClick} style={{ cursor: 'pointer' }}>
                <Icon name="Shield" className="mr-2 h-4 w-4" />
                <span>Segurança</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem onClick={handleLogoutClick} style={{ cursor: 'pointer' }}>
                  <Icon name="LogOut" className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Sair da aplicação</p>
              </TooltipContent>
            </Tooltip>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  )
}
