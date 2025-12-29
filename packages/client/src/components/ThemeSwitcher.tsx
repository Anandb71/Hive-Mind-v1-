/**
 * Theme Switcher Component
 * Toggle between light, dark, and custom themes
 */

import { useState, useEffect } from 'react';
import { Sun, Moon, Palette } from 'lucide-react';

type Theme = 'dark' | 'light' | 'midnight' | 'forest' | 'sunset';

interface ThemeConfig {
	name: string;
	icon: string;
	colors: {
		bgPrimary: string;
		bgSecondary: string;
		bgTertiary: string;
		textPrimary: string;
		textSecondary: string;
		accent: string;
		border: string;
	};
}

const THEMES: Record<Theme, ThemeConfig> = {
	dark: {
		name: 'Dark',
		icon: '🌙',
		colors: {
			bgPrimary: '#1e1e2e',
			bgSecondary: '#181825',
			bgTertiary: '#313244',
			textPrimary: '#cdd6f4',
			textSecondary: '#a6adc8',
			accent: '#89b4fa',
			border: '#45475a'
		}
	},
	light: {
		name: 'Light',
		icon: '☀️',
		colors: {
			bgPrimary: '#eff1f5',
			bgSecondary: '#e6e9ef',
			bgTertiary: '#ccd0da',
			textPrimary: '#4c4f69',
			textSecondary: '#6c6f85',
			accent: '#1e66f5',
			border: '#bcc0cc'
		}
	},
	midnight: {
		name: 'Midnight',
		icon: '🌌',
		colors: {
			bgPrimary: '#0d1117',
			bgSecondary: '#161b22',
			bgTertiary: '#21262d',
			textPrimary: '#c9d1d9',
			textSecondary: '#8b949e',
			accent: '#58a6ff',
			border: '#30363d'
		}
	},
	forest: {
		name: 'Forest',
		icon: '🌲',
		colors: {
			bgPrimary: '#1a2421',
			bgSecondary: '#141c19',
			bgTertiary: '#2d3b36',
			textPrimary: '#d4e4de',
			textSecondary: '#a3b8b0',
			accent: '#7ec699',
			border: '#3d5249'
		}
	},
	sunset: {
		name: 'Sunset',
		icon: '🌅',
		colors: {
			bgPrimary: '#2d2424',
			bgSecondary: '#231c1c',
			bgTertiary: '#3d3232',
			textPrimary: '#e8d5d5',
			textSecondary: '#c4a8a8',
			accent: '#f4a261',
			border: '#4d3d3d'
		}
	}
};

export function ThemeSwitcher() {
	const [theme, setTheme] = useState<Theme>('dark');
	const [showPicker, setShowPicker] = useState(false);

	useEffect(() => {
		const saved = localStorage.getItem('hivemind-theme') as Theme | null;
		if (saved && THEMES[saved]) {
			setTheme(saved);
			applyTheme(saved);
		}
	}, []);

	const applyTheme = (themeName: Theme) => {
		const config = THEMES[themeName];
		const root = document.documentElement;

		root.style.setProperty('--bg-primary', config.colors.bgPrimary);
		root.style.setProperty('--bg-secondary', config.colors.bgSecondary);
		root.style.setProperty('--bg-tertiary', config.colors.bgTertiary);
		root.style.setProperty('--text-primary', config.colors.textPrimary);
		root.style.setProperty('--text-secondary', config.colors.textSecondary);
		root.style.setProperty('--accent', config.colors.accent);
		root.style.setProperty('--border', config.colors.border);
	};

	const switchTheme = (newTheme: Theme) => {
		setTheme(newTheme);
		applyTheme(newTheme);
		localStorage.setItem('hivemind-theme', newTheme);
		setShowPicker(false);
	};

	return (
		<div className="theme-switcher">
			<button
				className="theme-toggle"
				onClick={() => setShowPicker(!showPicker)}
				title="Change theme"
			>
				<Palette size={16} />
				<span>{THEMES[theme].icon}</span>
			</button>

			{showPicker && (
				<div className="theme-picker">
					{(Object.keys(THEMES) as Theme[]).map(t => (
						<button
							key={t}
							className={`theme-option ${theme === t ? 'active' : ''}`}
							onClick={() => switchTheme(t)}
						>
							<span className="theme-icon">{THEMES[t].icon}</span>
							<span className="theme-name">{THEMES[t].name}</span>
							<div
								className="theme-preview"
								style={{
									background: THEMES[t].colors.bgPrimary,
									borderColor: THEMES[t].colors.accent
								}}
							/>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export { THEMES, type Theme };
