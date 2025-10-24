import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Users, Briefcase, TrendingUp } from 'lucide-react';
import techDomain from '@/assets/tech-domain.png';
import behavioralDomain from '@/assets/behavioral-domain.png';
import productDomain from '@/assets/product-domain.png';
import salesDomain from '@/assets/sales-domain.png';

interface Domain {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  color: string;
}

const domains: Domain[] = [
  {
    id: 'technical',
    name: 'Technical/Engineering',
    description: 'Coding, system design, algorithms',
    icon: <Code className="h-5 w-5" />,
    image: techDomain,
    color: 'hsl(230, 60%, 50%)',
  },
  {
    id: 'behavioral',
    name: 'Behavioral/Leadership',
    description: 'STAR method, situational questions',
    icon: <Users className="h-5 w-5" />,
    image: behavioralDomain,
    color: 'hsl(25, 70%, 55%)',
  },
  {
    id: 'product',
    name: 'Product/Design',
    description: 'Product thinking, UX, metrics',
    icon: <Briefcase className="h-5 w-5" />,
    image: productDomain,
    color: 'hsl(160, 60%, 45%)',
  },
  {
    id: 'sales',
    name: 'Sales/Marketing',
    description: 'Customer focus, growth strategies',
    icon: <TrendingUp className="h-5 w-5" />,
    image: salesDomain,
    color: 'hsl(340, 70%, 55%)',
  },
];

interface DomainSelectorProps {
  onSelect: (domain: string) => void;
  selectedDomain: string | null;
}

export const DomainSelector = ({ onSelect, selectedDomain }: DomainSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-fade-in">
      {domains.map((domain) => (
        <Card
          key={domain.id}
          className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
            selectedDomain === domain.id
              ? 'ring-2 ring-primary shadow-xl'
              : 'opacity-70 hover:opacity-100'
          }`}
          onClick={() => onSelect(domain.id)}
        >
          <div className="relative h-32 overflow-hidden">
            <img
              src={domain.image}
              alt={domain.name}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: `${domain.color}15` }}
              >
                {domain.icon}
              </div>
              <h3 className="font-semibold text-foreground">{domain.name}</h3>
              {selectedDomain === domain.id && (
                <Badge variant="default" className="ml-auto">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{domain.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};
