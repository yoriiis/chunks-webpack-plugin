#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { templateScript, templateStyle } from './webpack.config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

const errors = [];

// Config
const EXPECTED = JSON.parse(fs.readFileSync(path.join(__dirname, 'expected-output.json'), 'utf-8'));
const WEBPACK_DIST = path.join(__dirname, 'dist');

function error(msg) {
	errors.push(msg);
	console.log(`${RED}✗ ${msg}${RESET}`);
}

function success(msg) {
	console.log(`${GREEN}✓ ${msg}${RESET}`);
}

function checkFileExists(distDir, filePath) {
	// Remove leading /dist/ or /dist from the path
	const relativePath = filePath.replace(/^\/dist\//, '').replace(/^\/dist/, '');
	const fullPath = path.join(distDir, relativePath);
	return fs.existsSync(fullPath);
}

function checkBuild(name, distDir) {
	console.log(`\n${name}:`);

	if (!fs.existsSync(distDir)) {
		error(`${name}: Directory ${distDir} not found`);
		return;
	}

	// Check manifest
	const manifestPath = path.join(distDir, 'chunks-manifest.json');
	if (!fs.existsSync(manifestPath)) {
		error(`${name}: chunks-manifest.json not found`);
		return;
	}

	const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

	// Check that all expected entries exist in manifest
	for (const [entry, expected] of Object.entries(EXPECTED.entries)) {
		const manifestEntry = manifest[entry];
		if (!manifestEntry) {
			error(`${name} manifest: entry "${entry}" not found`);
			continue;
		}

		// Check that entry has styles and scripts keys
		if (!manifestEntry.styles || !Array.isArray(manifestEntry.styles)) {
			error(`${name} manifest: entry "${entry}" missing or invalid "styles" key`);
		}
		if (!manifestEntry.scripts || !Array.isArray(manifestEntry.scripts)) {
			error(`${name} manifest: entry "${entry}" missing or invalid "scripts" key`);
		}

		if (!manifestEntry.styles || !manifestEntry.scripts) {
			continue;
		}

		// Check styles count
		const actualStylesCount = manifestEntry.styles.length;
		const expectedStylesCount = expected.styles.count;
		if (actualStylesCount !== expectedStylesCount) {
			error(
				`${name} manifest: ${entry} styles count mismatch (expected ${expectedStylesCount}, got ${actualStylesCount})`
			);
		} else {
			success(`${name} manifest: ${entry} styles (${actualStylesCount} files)`);
		}

		// Check scripts count
		const actualScriptsCount = manifestEntry.scripts.length;
		const expectedScriptsCount = expected.scripts.count;
		if (actualScriptsCount !== expectedScriptsCount) {
			error(
				`${name} manifest: ${entry} scripts count mismatch (expected ${expectedScriptsCount}, got ${actualScriptsCount})`
			);
		} else {
			success(`${name} manifest: ${entry} scripts (${actualScriptsCount} files)`);
		}

		// Check that all files referenced in manifest exist
		for (const stylePath of manifestEntry.styles) {
			if (!checkFileExists(distDir, stylePath)) {
				error(`${name} manifest: ${entry} style file not found: ${stylePath}`);
			}
		}
		for (const scriptPath of manifestEntry.scripts) {
			if (!checkFileExists(distDir, scriptPath)) {
				error(`${name} manifest: ${entry} script file not found: ${scriptPath}`);
			}
		}

		// Check patterns for styles
		for (let i = 0; i < expected.styles.patterns.length; i++) {
			const pattern = new RegExp(`^${expected.styles.patterns[i]}$`);
			const actualPath = manifestEntry.styles[i];
			if (!pattern.test(actualPath)) {
				error(
					`${name} manifest: ${entry} style[${i}] pattern mismatch\n  Expected pattern: ${expected.styles.patterns[i]}\n  Got: ${actualPath}`
				);
			}
		}

		// Check patterns for scripts
		for (let i = 0; i < expected.scripts.patterns.length; i++) {
			const pattern = new RegExp(`^${expected.scripts.patterns[i]}$`);
			const actualPath = manifestEntry.scripts[i];
			if (!pattern.test(actualPath)) {
				error(
					`${name} manifest: ${entry} script[${i}] pattern mismatch\n  Expected pattern: ${expected.scripts.patterns[i]}\n  Got: ${actualPath}`
				);
			}
		}
	}

	// Check that manifest doesn't have extra entries
	const expectedEntries = Object.keys(EXPECTED.entries);
	const actualEntries = Object.keys(manifest);
	for (const entry of actualEntries) {
		if (!expectedEntries.includes(entry)) {
			error(`${name} manifest: unexpected entry "${entry}" found`);
		}
	}

	// Check template files
	for (const [entry, _expected] of Object.entries(EXPECTED.entries)) {
		// Determine template path (handle nested entries like "shared/app-a")
		const entryParts = entry.split('/');
		const dirParts = entryParts.slice(0, -1);
		const entryName = entryParts.at(-1);

		const templateDir = dirParts.length > 0 ? path.join('templates', ...dirParts) : 'templates';

		const manifestEntry = manifest[entry];
		if (!manifestEntry) {
			continue;
		}

		// Check scripts template
		const scriptsTemplatePath = path.join(distDir, templateDir, `${entryName}-scripts.html`);
		if (fs.existsSync(scriptsTemplatePath)) {
			const scriptsTemplate = fs.readFileSync(scriptsTemplatePath, 'utf-8');
			const manifestScripts = manifestEntry.scripts.map(templateScript).join('');

			if (scriptsTemplate === manifestScripts) {
				success(`Webpack template: ${entryName}-scripts.html is valid`);
			} else {
				error(
					`Webpack template: ${entryName}-scripts.html mismatch (expected ${manifestScripts}, got ${scriptsTemplate})`
				);
			}
		} else {
			error(`${name} template: ${scriptsTemplatePath} not found`);
		}

		// Check styles template
		const stylesTemplatePath = path.join(distDir, templateDir, `${entryName}-styles.html`);
		if (fs.existsSync(stylesTemplatePath)) {
			const stylesTemplate = fs.readFileSync(stylesTemplatePath, 'utf-8');
			const manifestStyle = manifestEntry.styles.map(templateStyle).join('');

			if (stylesTemplate === manifestStyle) {
				success(`Webpack template: ${entryName}-styles.html is valid`);
			} else {
				error(
					`Webpack template: ${entryName}-styles.html mismatch (expected ${manifestStyle}, got ${stylesTemplate})`
				);
			}
		} else {
			error(`${name} template: ${stylesTemplatePath} not found`);
		}
	}
}

checkBuild('Webpack', WEBPACK_DIST);

console.log(
	errors.length === 0
		? `\n${GREEN}✓ All checks passed!${RESET}\n`
		: `\n${RED}✗ ${errors.length} error(s) found${RESET}\n`
);

process.exit(errors.length === 0 ? 0 : 1);
