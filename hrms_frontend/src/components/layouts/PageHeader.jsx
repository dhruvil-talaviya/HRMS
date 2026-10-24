const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-text-primary lowercase">{title}</h1>
        {subtitle && <p className="text-sm text-text-muted mt-1 lowercase">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
};

export default PageHeader;
