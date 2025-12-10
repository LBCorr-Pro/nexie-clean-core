// src/app/[locale]/(public)/plans/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check } from 'lucide-react';

const PlanCard = ({ title, price, features }: { title: string, price: string, features: string[] }) => (
    <Card className="flex flex-col">
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="text-4xl font-bold">{price}<span className="text-sm font-normal text-muted-foreground">/mês</span></CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            <ul className="space-y-2">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        <span className="text-muted-foreground">{feature}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
    </Card>
);

export default function PlansPage() {
  return (
    <div className="container mx-auto max-w-5xl py-24 sm:py-32">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Planos para todos</h1>
            <p className="mt-4 text-lg text-muted-foreground">Escolha o plano que melhor se adapta às suas necessidades.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PlanCard title="Básico" price="R$ 29" features={["10 Usuários", "5 Projetos", "Suporte por Email"]} />
            <PlanCard title="Profissional" price="R$ 99" features={["50 Usuários", "Projetos Ilimitados", "Suporte Prioritário", "Integrações API"]} />
            <PlanCard title="Enterprise" price="Custom" features={["Usuários Ilimitados", "Recursos Dedicados", "Suporte 24/7", "SSO e Segurança Avançada"]} />
        </div>
    </div>
  );
}
