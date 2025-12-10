import React from 'react';

interface PageTitleProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, description, children }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
};

export default PageTitle;
