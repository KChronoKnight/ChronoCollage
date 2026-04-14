import { Workspace } from './components/Workspace/Workspace';
import { CollageModal } from './components/CollageModal/CollageModal';
import { AutoCollage } from './components/AutoCollage/AutoCollage';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const modalOpen = useAppStore((s) => s.modalOpen);
  const autoCollageOpen = useAppStore((s) => s.autoCollageOpen);

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ background: '#1a1a1a' }}>
      <Workspace />
      {modalOpen && <CollageModal />}
      {autoCollageOpen && <AutoCollage />}
    </div>
  );
}
