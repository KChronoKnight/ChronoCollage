import { useAppStore } from '../../store/useAppStore';

export function ActionBar() {
  const openModal = useAppStore((s) => s.openModal);
  const setAutoCollageOpen = useAppStore((s) => s.setAutoCollageOpen);

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-2 rounded-xl shadow-2xl z-50"
      style={{ background: 'rgba(30,30,30,0.85)', border: '1px solid #3a3a3a', backdropFilter: 'blur(12px)' }}
    >
      <ActionButton icon={<GridDotsIcon />} label="Automatic Collage" onClick={() => setAutoCollageOpen(true)} />
      <ActionButton icon={<GridDotsIcon />} label="Manual Collage" onClick={openModal} />
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer"
      style={{
        background: '#2E3035',
        border: '1px solid transparent',
        color: '#999',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(77,184,164,0.15)';
        e.currentTarget.style.color = '#4db8a4';
        e.currentTarget.style.borderColor = 'rgba(77,184,164,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#2E3035';
        e.currentTarget.style.color = '#999';
        e.currentTarget.style.borderColor = 'transparent';
      }}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function GridDotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="5" cy="5" r="1.5" />
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="19" cy="5" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
      <circle cx="5" cy="19" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
      <circle cx="19" cy="19" r="1.5" />
    </svg>
  );
}
