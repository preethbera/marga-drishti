import React from "react";

export default function DocsLayout({ title, description, toc, children }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex-1 w-full bg-background">
      <div className="max-w-[1400px] mx-auto p-6 md:p-12 lg:py-16 flex gap-12">
        
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 max-w-4xl">
          {/* Page Header */}
          <div className="space-y-4 mb-16">
            <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
            {description && (
              <p className="text-xl text-muted-foreground">{description}</p>
            )}
          </div>

          <div className="space-y-12">
            {children}
          </div>

          <div className="h-32"></div>
        </div>

        {/* Right Sticky TOC */}
        {toc && toc.length > 0 && (
          <div className="hidden xl:block w-64 shrink-0 sticky top-12 self-start max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">On This Page</h4>
            <ul className="space-y-2 text-sm">
                {toc.map((item) => (
                  <li key={item.id}>
                    <button 
                      onClick={() => scrollTo(item.id)} 
                      className="text-muted-foreground hover:text-foreground text-left w-full transition-colors"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
          </div>
        )}

      </div>
    </div>
  );
}
