import { ThemeInspector } from '../components/ThemeInspector';
import { themes } from '../lib/themeEngine';

export function OwnerThemeInspectorPage() {
  return (
    <div className="p-4">
      <ThemeInspector theme={themes[0]} />
    </div>
  );
}
